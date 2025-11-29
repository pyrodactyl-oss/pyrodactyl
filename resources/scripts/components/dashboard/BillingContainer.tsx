import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

import { BillingService, BillingServiceRow } from '@/components/dashboard/BillingServiceRow';
import AnimatedCollapsible from '@/components/elements/AnimatedCollapsible';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import { PageListContainer } from '@/components/elements/pages/PageList';

import getServers from '@/api/getServers';
import { PaginatedResult } from '@/api/http';
import { Server } from '@/api/server/getServer';
import { SortOption, getServerPreferences } from '@/api/servers/serverOrder';

// optional, remove if not added

function mapServerStatusToBillingStatus(s: Server['status'] | null | undefined): BillingService['status'] {
    if (s === 'suspended') return 'paused';
    if (s === 'installing' || s === 'restoring_backup') return 'incomplete';
    if (s === 'offline' || s == null) return 'canceled';
    return 'active';
}

const BillingContainer = () => {
    // Load servers (first page; adjust if you want pagination here)
    const { data: servers } = useSWR<PaginatedResult<Server>>(['/api/client/servers', 'billing-view'], () =>
        getServers({ page: 1 }),
    );

    // Load the saved sort preferences (same source as the dashboard)
    const [sortOption, setSortOption] = useState<SortOption>('default');
    const [customOrder, setCustomOrder] = useState<string[]>([]);

    useEffect(() => {
        getServerPreferences()
            .then((prefs) => {
                setSortOption(prefs.sortOption);
                setCustomOrder(prefs.order || []);
            })
            .catch((err) => console.error('Failed to fetch server preferences (billing):', err));
    }, []);

    const getServerName = (server: Server) => (server as any).name?.toString?.() ?? '';

    // Apply the same sorting logic as the dashboard
    const sortedServers = useMemo(() => {
        if (!servers) return undefined;

        if (sortOption === 'name_asc') {
            const copy = [...servers.items];
            copy.sort((a, b) =>
                getServerName(a).localeCompare(getServerName(b), undefined, {
                    sensitivity: 'base',
                }),
            );
            return { ...servers, items: copy };
        }

        if (sortOption === 'custom') {
            const orderToUse = customOrder;

            if (orderToUse.length === 0) {
                return servers;
            }

            const copy = [...servers.items];
            copy.sort((a, b) => {
                const indexA = orderToUse.indexOf(a.uuid);
                const indexB = orderToUse.indexOf(b.uuid);

                if (indexA === -1 && indexB === -1) return 0;
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;

                return indexA - indexB;
            });

            return { ...servers, items: copy };
        }

        // default: API order
        return servers;
    }, [servers, sortOption, customOrder]);

    // Map to billing rows (placeholders for plan/price/renewal)
    const services: BillingService[] = useMemo(() => {
        if (!sortedServers) return [];
        return sortedServers.items.map((srv) => ({
            id: srv.uuid,
            externalId: String(srv.id),
            name: srv.name,
            planName: 'Standard Plan',
            priceAmount: 9.99,
            priceFormatted: '$9.99',
            currency: 'USD',
            interval: 'month',
            status: mapServerStatusToBillingStatus(srv.status),
            nextRenewalAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
            manageUrl: `/server/${srv.id}`, // Manage opens server details
            canCancel: false,
            canResume: false,
        }));
    }, [sortedServers]);

    const [expanded, setExpanded] = useState(false);
    const visibleCount = 4;
    const visible = services.slice(0, visibleCount);
    const hidden = services.slice(visibleCount);
    const hasHidden = hidden.length > 0;

    return (
        <div
            className='transform-gpu skeleton-anim-2 mb-3 sm:mb-4'
            style={{
                animationDelay: '50ms',
                animationTimingFunction:
                    'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
            }}
        >
            <PageContentBlock title={'Billing'} showFlashKey={'billing'}>
                <div
                    className='transform-gpu skeleton-anim-2 mb-3 sm:mb-4'
                    style={{
                        animationDelay: '75ms',
                        animationTimingFunction:
                            'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                    }}
                >
                    <MainPageHeader title='Active Services' />
                    <PageListContainer className='p-4 flex flex-col gap-3'>
                        {!sortedServers ? (
                            <div className='p-4 text-sm text-white/70'>Loading services…</div>
                        ) : services.length === 0 ? (
                            <div className='p-4 text-sm text-white/70'>No active services yet.</div>
                        ) : (
                            <>
                                {visible.map((service, index) => (
                                    <div
                                        key={service.id}
                                        className='transform-gpu skeleton-anim-2'
                                        style={{
                                            animationDelay: `${index * 50 + 50}ms`,
                                            animationTimingFunction:
                                                'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                                        }}
                                    >
                                        <BillingServiceRow service={service} />
                                    </div>
                                ))}

                                {hasHidden && (
                                    <div className='flex flex-col gap-3'>
                                        {!expanded ? (
                                            <button
                                                onClick={() => setExpanded(true)}
                                                className='mt-1 inline-flex items-center justify-center gap-2 rounded-md bg-[#ffffff11] hover:bg-[#ffffff23] px-3 py-2 text-sm font-medium text-[#ffffffcc] transition-colors'
                                                aria-expanded={expanded}
                                            >
                                                Show {hidden.length} more
                                                <svg
                                                    xmlns='http://www.w3.org/2000/svg'
                                                    width='14'
                                                    height='14'
                                                    viewBox='0 0 24 24'
                                                    fill='none'
                                                    stroke='currentColor'
                                                    strokeWidth='2'
                                                    strokeLinecap='round'
                                                    strokeLinejoin='round'
                                                >
                                                    <polyline points='6 9 12 15 18 9' />
                                                </svg>
                                            </button>
                                        ) : null}

                                        {/* If you didn't add AnimatedCollapsible, replace with: {expanded && <div> ...hidden map... </div>} */}
                                        <AnimatedCollapsible open={expanded} durationMs={260}>
                                            <div className='flex flex-col gap-3'>
                                                {hidden.map((service, i) => {
                                                    const index = visible.length + i;
                                                    return (
                                                        <div
                                                            key={service.id}
                                                            className='transform-gpu skeleton-anim-2'
                                                            style={{
                                                                animationDelay: `${index * 50 + 50}ms`,
                                                                animationTimingFunction:
                                                                    'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                                                            }}
                                                        >
                                                            <div
                                                                className='transition-all duration-300'
                                                                style={{
                                                                    opacity: expanded ? 1 : 0,
                                                                    transform: expanded
                                                                        ? 'translateY(0px)'
                                                                        : 'translateY(-4px)',
                                                                }}
                                                            >
                                                                <BillingServiceRow service={service} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </AnimatedCollapsible>

                                        {expanded && (
                                            <button
                                                onClick={() => setExpanded(false)}
                                                className='inline-flex items-center justify-center gap-2 rounded-md bg-[#ffffff11] hover:bg-[#ffffff23] px-3 py-2 text-sm font-medium text-[#ffffffcc] transition-colors'
                                                aria-expanded={expanded}
                                            >
                                                Show less
                                                <svg
                                                    xmlns='http://www.w3.org/2000/svg'
                                                    width='14'
                                                    height='14'
                                                    viewBox='0 0 24 24'
                                                    fill='none'
                                                    stroke='currentColor'
                                                    strokeWidth='2'
                                                    strokeLinecap='round'
                                                    strokeLinejoin='round'
                                                >
                                                    <polyline points='18 15 12 9 6 15' />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </PageListContainer>
                </div>

                <div aria-hidden className='mt-16 mb-16 bg-[#ffffff33] min-h-[1px] w-full'></div>

                <div
                    className='transform-gpu skeleton-anim-2 mb-3 sm:mb-4'
                    style={{
                        animationDelay: '100ms',
                        animationTimingFunction:
                            'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                    }}
                >
                    <MainPageHeader title='Billing & Invoices' />
                    <PageListContainer className='p-4'>
                        <div className='p-4 text-sm text-white/70'>No invoices yet.</div>
                    </PageListContainer>
                </div>
            </PageContentBlock>
        </div>
    );
};

export default BillingContainer;
