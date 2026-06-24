import { ArrowDownToLine, ArrowRotateLeft, Funnel, Magnifier, Xmark } from '@gravity-ui/icons';
import { useEffect, useMemo, useState } from 'react';
import { type ActivityLogFilters, useActivityLogs } from '@/api/account/activity';
import ActionButton from '@/components/elements/ActionButton';
import ActivityLogEntry from '@/components/elements/activity/ActivityLogEntry';
import { Input } from '@/components/elements/inputs';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Select from '@/components/elements/Select';
import Spinner from '@/components/elements/Spinner';
import PaginationFooter from '@/components/elements/table/PaginationFooter';
import FlashMessageRender from '@/components/FlashMessageRender';

import { useFlashKey } from '@/plugins/useFlash';
import useLocationHash from '@/plugins/useLocationHash';

const ActivityLogContainer = () => {
    const { hash } = useLocationHash();
    const { clearAndAddHttpError } = useFlashKey('account');
    const [filters, setFilters] = useState<ActivityLogFilters>({
        page: 1,
        sorts: { timestamp: -1 },
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEventType, setSelectedEventType] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [dateRange, setDateRange] = useState('all');

    const { data, isValidating, error } = useActivityLogs(filters, {
        revalidateOnMount: true,
        revalidateOnFocus: false,
        refreshInterval: autoRefresh ? 30_000 : 0, // Auto-refresh every 30 seconds
    });

    // Extract unique event types for filter dropdown
    const eventTypes = useMemo(() => {
        if (!data?.items) return [];
        const types = [...new Set(data.items.map((item) => item.event))];
        return types.sort();
    }, [data?.items]);

    // Filter data based on search term and event type
    const filteredData = useMemo(() => {
        if (!data?.items) return data;

        let filtered = data.items;

        if (searchTerm) {
            filtered = filtered.filter(
                (item) =>
                    item.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.ip?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.relationships.actor?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    JSON.stringify(item.properties).toLowerCase().includes(searchTerm.toLowerCase()),
            );
        }

        if (selectedEventType) {
            filtered = filtered.filter((item) => item.event === selectedEventType);
        }

        // Apply date range filtering
        if (dateRange !== 'all') {
            const now = new Date();
            const cutoff = new Date();

            switch (dateRange) {
                case '1h':
                    cutoff.setHours(now.getHours() - 1);
                    break;
                case '24h':
                    cutoff.setDate(now.getDate() - 1);
                    break;
                case '7d':
                    cutoff.setDate(now.getDate() - 7);
                    break;
                case '30d':
                    cutoff.setDate(now.getDate() - 30);
                    break;
            }

            filtered = filtered.filter((item) => new Date(item.timestamp) >= cutoff);
        }

        return { ...data, items: filtered };
    }, [data, searchTerm, selectedEventType, dateRange]);

    const exportLogs = () => {
        if (!filteredData?.items) return;

        const csvContent = [
            ['Timestamp', 'Event', 'Actor', 'IP Address', 'Properties'].join(','),
            ...filteredData.items.map((item) =>
                [
                    new Date(item.timestamp).toISOString(),
                    item.event,
                    item.relationships.actor?.username || 'System',
                    item.ip || '',
                    JSON.stringify(item.properties).replace(/"/g, '""'),
                ]
                    .map((field) => `"${field}"`)
                    .join(','),
            ),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity-log-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const clearAllFilters = () => {
        setFilters((value) => ({ ...value, filters: {} }));
        setSearchTerm('');
        setSelectedEventType('');
        setDateRange('all');
    };

    const hasActiveFilters =
        filters.filters?.event || filters.filters?.ip || searchTerm || selectedEventType || dateRange !== 'all';

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'f':
                        e.preventDefault();
                        setShowFilters(!showFilters);
                        break;
                    case 'r':
                        e.preventDefault();
                        setAutoRefresh(!autoRefresh);
                        break;
                    case 'e':
                        e.preventDefault();
                        exportLogs();
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showFilters, autoRefresh]);

    useEffect(() => {
        setFilters((value) => ({
            ...value,
            filters: { ip: hash.ip, event: hash.event },
        }));
    }, [hash]);

    useEffect(() => {
        clearAndAddHttpError(error);
    }, [error]);

    return (
        <PageContentBlock title={'Account Activity Log'}>
            <div className='flex h-full min-h-full w-full flex-1 flex-col px-2 sm:px-0'>
                <FlashMessageRender byKey={'account'} />

                <div
                    className='skeleton-anim-2 mb-3 transform-gpu sm:mb-4'
                    style={{
                        animationDelay: '75ms',
                        animationTimingFunction:
                            'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                    }}
                >
                    <MainPageHeader title={'Activity Log'}>
                        <div className='flex flex-wrap items-center gap-2'>
                            <ActionButton
                                className='flex items-center gap-2'
                                onClick={() => setShowFilters(!showFilters)}
                                title='Toggle Filters (Ctrl+F)'
                                variant='secondary'
                            >
                                <Funnel fill='currentColor' height={22} width={22} />
                                Filters
                                {hasActiveFilters && <span className='h-2 w-2 rounded-full bg-blue-500' />}
                            </ActionButton>
                            <ActionButton
                                className='flex items-center gap-2'
                                onClick={() => setAutoRefresh(!autoRefresh)}
                                title='Auto Refresh (Ctrl+R)'
                                variant={autoRefresh ? 'primary' : 'secondary'}
                            >
                                {autoRefresh ? (
                                    <Xmark fill='currentColor' height={22} width={22} />
                                ) : (
                                    <Magnifier fill='currentColor' height={22} width={22} />
                                )}
                                {autoRefresh ? 'Live' : 'Refresh'}
                            </ActionButton>
                            <ActionButton
                                className='flex items-center gap-2'
                                disabled={!filteredData?.items?.length}
                                onClick={exportLogs}
                                title='Export CSV (Ctrl+E)'
                                variant='secondary'
                            >
                                <ArrowDownToLine fill='currentColor' height={22} width={22} />
                                Export
                            </ActionButton>
                        </div>
                    </MainPageHeader>
                </div>

                {showFilters && (
                    <div
                        className='skeleton-anim-2 mb-3 transform-gpu sm:mb-4'
                        style={{
                            animationDelay: '100ms',
                            animationTimingFunction:
                                'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                        }}
                    >
                        <div className='rounded-xl border-[#ffffff12] border-[1px] bg-gradient-to-b from-[#ffffff08] to-[#ffffff05] p-4 shadow-sm transition-all duration-150 hover:border-[#ffffff20]'>
                            <div className='mb-4 flex items-center gap-2'>
                                <div className='flex h-5 w-5 items-center justify-center rounded-lg bg-[#ffffff11]'>
                                    <Funnel className='text-zinc-400' fill='currentColor' height={22} width={22} />
                                </div>
                                <h3 className='font-semibold text-base text-zinc-100'>Filters</h3>
                            </div>

                            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                                <div>
                                    <label className='mb-2 block font-medium text-sm text-zinc-300'>Search</label>
                                    <div className='relative'>
                                        <Magnifier
                                            className='pointer-events-none absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 transform text-zinc-400'
                                            fill='currentColor'
                                            height={22}
                                            width={22}
                                        />
                                        <Input.Text
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder='Search events, IPs, users...'
                                            style={{ paddingLeft: '2.5rem' }}
                                            type='text'
                                            value={searchTerm}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className='mb-2 block font-medium text-sm text-zinc-300'>Event Type</label>
                                    <Select
                                        className='w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-zinc-100 transition-colors duration-150 hover:border-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                                        onChange={(e) => setSelectedEventType(e.target.value)}
                                        value={selectedEventType}
                                    >
                                        <option style={{ backgroundColor: '#27272a', color: '#f4f4f5' }} value=''>
                                            All Events
                                        </option>
                                        {eventTypes.map((type) => (
                                            <option
                                                key={type}
                                                style={{ backgroundColor: '#27272a', color: '#f4f4f5' }}
                                                value={type}
                                            >
                                                {type}
                                            </option>
                                        ))}
                                    </Select>
                                </div>

                                <div>
                                    <label className='mb-2 block font-medium text-sm text-zinc-300'>Time Range</label>
                                    <Select
                                        className='w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-zinc-100 transition-colors duration-150 hover:border-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                                        onChange={(e) => setDateRange(e.target.value)}
                                        value={dateRange}
                                    >
                                        <option style={{ backgroundColor: '#27272a', color: '#f4f4f5' }} value='all'>
                                            All Time
                                        </option>
                                        <option style={{ backgroundColor: '#27272a', color: '#f4f4f5' }} value='1h'>
                                            Last Hour
                                        </option>
                                        <option style={{ backgroundColor: '#27272a', color: '#f4f4f5' }} value='24h'>
                                            Last 24 Hours
                                        </option>
                                        <option style={{ backgroundColor: '#27272a', color: '#f4f4f5' }} value='7d'>
                                            Last 7 Days
                                        </option>
                                        <option style={{ backgroundColor: '#27272a', color: '#f4f4f5' }} value='30d'>
                                            Last 30 Days
                                        </option>
                                    </Select>
                                </div>

                                <div className='flex items-end'>
                                    {hasActiveFilters && (
                                        <ActionButton
                                            className='flex w-full items-center gap-2'
                                            onClick={clearAllFilters}
                                            variant='secondary'
                                        >
                                            <Xmark fill='currentColor' height={22} width={22} />
                                            Clear All Filters
                                        </ActionButton>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div
                    className='skeleton-anim-2 transform-gpu'
                    style={{
                        animationDelay: '125ms',
                        animationTimingFunction:
                            'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                    }}
                >
                    <div className='rounded-xl border-[#ffffff12] border-[1px] bg-gradient-to-b from-[#ffffff08] to-[#ffffff05] p-4 shadow-sm transition-all duration-150 hover:border-[#ffffff20]'>
                        <div className='mb-4 flex items-center gap-2'>
                            <div className='flex h-5 w-5 items-center justify-center rounded-lg bg-[#ffffff11]'>
                                <Magnifier className='text-zinc-400' fill='currentColor' height={22} width={22} />
                            </div>
                            <h3 className='font-semibold text-base text-zinc-100'>Activity Events</h3>
                            {filteredData?.items && (
                                <span className='text-sm text-zinc-400'>
                                    ({filteredData.items.length} {filteredData.items.length === 1 ? 'event' : 'events'})
                                </span>
                            )}
                        </div>

                        {!data && isValidating ? (
                            <Spinner centered />
                        ) : filteredData?.items?.length ? (
                            <div className='divide-y divide-zinc-800/30'>
                                {filteredData.items.map((activity) => (
                                    <ActivityLogEntry activity={activity} key={activity.id}>
                                        {typeof activity.properties.useragent === 'string' && <span />}
                                    </ActivityLogEntry>
                                ))}
                            </div>
                        ) : (
                            <div className='py-12 text-center'>
                                <ArrowRotateLeft
                                    className='mb-4 text-zinc-600'
                                    fill='currentColor'
                                    height={22}
                                    width={22}
                                />
                                <h3 className='mb-2 font-semibold text-lg text-zinc-300'>
                                    {hasActiveFilters ? 'No Matching Activity' : 'No Activity Yet'}
                                </h3>
                                <p className='mx-auto mb-4 max-w-lg text-sm text-zinc-400 leading-relaxed'>
                                    {hasActiveFilters
                                        ? "Try adjusting your filters or search terms to find the activity you're looking for."
                                        : 'Activity logs will appear here as you use your account. Check back later or perform some actions to see them here.'}
                                </p>
                                {hasActiveFilters && (
                                    <div className='flex justify-center gap-2'>
                                        <ActionButton onClick={clearAllFilters} variant='secondary'>
                                            Clear All Filters
                                        </ActionButton>
                                        <ActionButton onClick={() => setShowFilters(true)} variant='secondary'>
                                            Adjust Filters
                                        </ActionButton>
                                    </div>
                                )}
                            </div>
                        )}

                        {data && (
                            <div className='mt-4'>
                                <PaginationFooter
                                    onPageSelect={(page) => setFilters((value) => ({ ...value, page }))}
                                    pagination={data.pagination}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageContentBlock>
    );
};

export default ActivityLogContainer;
