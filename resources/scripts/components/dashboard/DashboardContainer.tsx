import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { Bars, ChevronDown, House, LayoutCellsLarge, SlidersVertical } from '@gravity-ui/icons';
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useStoreState } from 'easy-peasy';
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import useSWR from 'swr';

import AnnouncementBanner from '@/components/dashboard/AnnouncementBanner';
import ServerRow from '@/components/dashboard/ServerRow';
import SortableServerRow from '@/components/dashboard/SortableServerRow';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/elements/DropdownMenu';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Pagination from '@/components/elements/Pagination';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/elements/Tabs';
import { PageListContainer } from '@/components/elements/pages/PageList';

import getAnnouncements, { Announcement as AnnouncementType } from '@/api/getAnnouncements';
import getServers from '@/api/getServers';
import { PaginatedResult } from '@/api/http';
import { Server } from '@/api/server/getServer';
import { SortOption, getServerPreferences, updateServerPreferences } from '@/api/servers/serverOrder';

import useFlash from '@/plugins/useFlash';
import { usePersistedState } from '@/plugins/usePersistedState';

import { MainPageHeader } from '../elements/MainPageHeader';

const DashboardContainer = () => {
    const getTitle = () => {
        if (serverViewMode === 'admin-all') return 'All Servers (Admin)';
        if (serverViewMode === 'all') return 'All Accessible Servers';
        return 'Your Servers';
    };

    const { search } = useLocation();
    const defaultPage = Number(new URLSearchParams(search).get('page') || '1');

    const [page, setPage] = useState(!isNaN(defaultPage) && defaultPage > 0 ? defaultPage : 1);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const uuid = useStoreState((state) => state.user.data!.uuid);
    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    // const showOnlyAdmin = usePersistedState(`${uuid}:show_all_servers`, false);

    const [serverViewMode, setServerViewMode] = usePersistedState<'owner' | 'admin-all' | 'all'>(
        `${uuid}:server_view_mode`,
        'owner',
    );

    const [dashboardDisplayOption, setDashboardDisplayOption] = usePersistedState(
        `${uuid}:dashboard_display_option`,
        'list',
    );
    const getApiType = (): string | undefined => {
        if (serverViewMode === 'owner') return 'owner';
        if (serverViewMode === 'admin-all') return 'admin-all';
        if (serverViewMode === 'all') return 'all';
        return undefined;
    };

    // Server preferences state
    const [sortOption, setSortOption] = useState<SortOption>('default');
    const [customOrder, setCustomOrder] = useState<string[]>([]);
    const [isEditingOrder, setIsEditingOrder] = useState(false);
    const [isSavingOrder, setIsSavingOrder] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);

    const { data: servers, error } = useSWR<PaginatedResult<Server>>(
        ['/api/client/servers', serverViewMode, page],
        () => getServers({ page, type: getApiType() }),
        { revalidateOnFocus: false },
    );

    const { data: announcements } = useSWR<AnnouncementType[]>(['/api/client/announcements'], getAnnouncements, {
        revalidateOnFocus: true,
    });

    useEffect(() => {
        if (!servers) return;
        if (servers.pagination.currentPage > 1 && !servers.items.length) {
            setPage(1);
        }
    }, [servers?.pagination.currentPage]);

    useEffect(() => {
        // Don't use react-router to handle changing this part of the URL, otherwise it
        // triggers a needless re-render. We just want to track this in the URL incase the
        // user refreshes the page.
        window.history.replaceState(null, document.title, `/${page <= 1 ? '' : `?page=${page}`}`);
    }, [page]);

    useEffect(() => {
        if (error) clearAndAddHttpError({ key: 'dashboard', error });
        if (!error) clearFlashes('dashboard');
    }, [error]);

    // Fetch server preferences when component mounts
    useEffect(() => {
        getServerPreferences()
            .then((prefs) => {
                setCustomOrder(prefs.order);
                setSortOption(prefs.sortOption);
            })
            .catch((err) => console.error('Failed to fetch server preferences:', err));
    }, []);

    // When entering edit mode, initialize customOrder if empty or sync with current servers
    useEffect(() => {
        if (isEditingOrder && servers) {
            // If customOrder is empty or doesn't match current servers, initialize it
            const currentServerUuids = servers.items.map((s) => s.uuid);

            if (customOrder.length === 0) {
                // Initialize with current server order
                setCustomOrder(currentServerUuids);
            } else {
                // Add any new servers that aren't in the custom order
                const newServers = currentServerUuids.filter((uuid) => !customOrder.includes(uuid));
                if (newServers.length > 0) {
                    setCustomOrder([...customOrder, ...newServers]);
                }
            }
        }
    }, [isEditingOrder, servers]);

    // Helper: safely get server name (adjust if your Server type differs)
    const getServerName = (server: Server) => (server as any).name?.toString?.() ?? '';

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    // Handle drag start
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    // Handle drag end
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setCustomOrder((items) => {
                const oldIndex = items.indexOf(active.id as string);
                const newIndex = items.indexOf(over.id as string);
                return arrayMove(items, oldIndex, newIndex);
            });
        }

        setActiveId(null);
    };

    // Save custom order to backend
    const handleSaveOrder = async () => {
        setIsSavingOrder(true);
        try {
            await updateServerPreferences({ order: customOrder });
            setIsEditingOrder(false);
            clearFlashes('dashboard');
        } catch (err) {
            console.error('Failed to save custom order:', err);
            clearAndAddHttpError({ key: 'dashboard', error: err });
        } finally {
            setIsSavingOrder(false);
        }
    };

    // Update sort option in backend when it changes
    const handleSortOptionChange = async (newSortOption: SortOption) => {
        setSortOption(newSortOption);

        try {
            // If switching to custom and customOrder is empty, initialize it with current server order
            if (newSortOption === 'custom' && servers) {
                const currentServerUuids = servers.items.map((s) => s.uuid);

                // If customOrder is empty or doesn't match current servers, initialize it
                if (customOrder.length === 0) {
                    setCustomOrder(currentServerUuids);
                    await updateServerPreferences({
                        sortOption: newSortOption,
                        order: currentServerUuids, // Save the initial order
                    });
                } else {
                    // Add any new servers that aren't in the custom order
                    const newServers = currentServerUuids.filter((uuid) => !customOrder.includes(uuid));
                    const updatedOrder = newServers.length > 0 ? [...customOrder, ...newServers] : customOrder;

                    if (newServers.length > 0) {
                        setCustomOrder(updatedOrder);
                    }

                    await updateServerPreferences({
                        sortOption: newSortOption,
                        order: updatedOrder,
                    });
                }
            } else {
                // For other sort options, just save the sort option
                await updateServerPreferences({ sortOption: newSortOption });
            }
        } catch (err) {
            console.error('Failed to save sort option:', err);
        }
    };

    // Sorted items for the current page
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
            // When in edit mode, use customOrder state
            // Otherwise apply saved custom order
            const orderToUse = isEditingOrder ? customOrder : customOrder;

            if (orderToUse.length === 0) {
                // No custom order yet, use default order
                return servers;
            }

            const copy = [...servers.items];
            copy.sort((a, b) => {
                const indexA = orderToUse.indexOf(a.uuid);
                const indexB = orderToUse.indexOf(b.uuid);

                // If server not in custom order, put it at the end
                if (indexA === -1 && indexB === -1) return 0;
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;

                return indexA - indexB;
            });

            return { ...servers, items: copy };
        }

        // default order: no sorting, use API order
        return servers;
    }, [servers, sortOption, customOrder, isEditingOrder]);

    return (
        <PageContentBlock title={'Dashboard'} showFlashKey={'dashboard'}>
            <div className='w-full h-full min-h-full flex-1 flex flex-col px-2 sm:px-0'>
                <AnnouncementBanner announcements={announcements || []} />
                <Tabs
                    defaultValue={dashboardDisplayOption}
                    onValueChange={(value) => {
                        setDashboardDisplayOption(value);
                    }}
                    className='w-full'
                >
                    <div
                        className='transform-gpu skeleton-anim-2 mb-3 sm:mb-4'
                        style={{
                            animationDelay: '50ms',
                            animationTimingFunction:
                                'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                        }}
                    >
                        <MainPageHeader
                            title={getTitle()}
                            titleChildren={
                                <div className='flex gap-4'>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className='inline-flex h-9 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#ffffff11] px-3 py-1.5 text-sm font-medium text-[#ffffff88] transition-all hover:bg-[#ffffff23] hover:text-[#ffffff] focus-visible:outline-hidden'>
                                                {/* Filter icon */}
                                                <svg
                                                    xmlns='http://www.w3.org/2000/svg'
                                                    width='20'
                                                    height='21'
                                                    viewBox='0 0 20 21'
                                                    fill='none'
                                                >
                                                    <path
                                                        d='M17 3.25C17 3.05109 16.921 2.86032 16.7803 2.71967C16.6397 2.57902 16.4489 2.5 16.25 2.5C16.0511 2.5 15.8603 2.57902 15.7197 2.71967C15.579 2.86032 15.5 3.05109 15.5 3.25V8.75C15.5 8.94891 15.579 9.13968 15.7197 9.28033C15.8603 9.42098 16.0511 9.5 16.25 9.5C16.4489 9.5 16.6397 9.42098 16.7803 9.28033C16.921 9.13968 17 8.94891 17 8.75V3.25ZM17 16.25C17 16.0511 16.921 15.8603 16.7803 15.7197C16.6397 15.579 16.4489 15.5 16.25 15.5C16.0511 15.5 15.8603 15.579 15.7197 15.7197C15.579 15.8603 15.5 16.0511 15.5 16.25V17.75C15.5 17.9489 15.579 18.1397 15.7197 18.2803C15.8603 18.421 16.0511 18.5 16.25 18.5C16.4489 18.5 16.6397 18.421 16.7803 18.2803C16.921 18.1397 17 17.9489 17 17.75V16.25ZM3.75 15.5C3.94891 15.5 4.13968 15.579 4.28033 15.7197C4.42098 15.8603 4.5 16.0511 4.5 16.25V17.75C4.5 17.9489 4.42098 18.1397 4.28033 18.2803C4.13968 18.421 3.94891 18.5 3.75 18.5C3.55109 18.5 3.36032 18.421 3.21967 18.2803C3.07902 18.1397 3 17.9489 3 17.75V16.25C3 16.0511 3.07902 15.8603 3.21967 15.7197C3.36032 15.579 3.55109 15.5 3.75 15.5ZM4.5 3.25C4.5 3.05109 4.42098 2.86032 4.28033 2.71967C4.13968 2.57902 3.94891 2.5 3.75 2.5C3.55109 2.5 3.36032 2.57902 3.21967 2.71967C3.07902 2.86032 3 3.05109 3 3.25V8.75C3 8.94891 3.07902 9.13968 3.21967 9.28033C3.36032 9.42098 3.55109 9.5 3.75 9.5C3.94891 9.5 4.13968 9.42098 4.28033 9.28033C4.42098 9.13968 4.5 8.94891 4.5 8.75V3.25ZM10 11.5C10.1989 11.5 10.3897 11.579 10.5303 11.7197C10.671 11.8603 10.75 12.0511 10.75 12.25V17.75C10.75 17.9489 10.671 18.1397 10.5303 18.2803C10.3897 18.421 10.1989 18.5 10 18.5C9.80109 18.5 9.61032 18.421 9.46967 18.2803C9.32902 18.1397 9.25 17.9489 9.25 17.75V12.25C9.25 12.0511 9.32902 11.8603 9.46967 11.7197C9.61032 11.579 9.80109 11.5 10 11.5ZM10.75 3.25C10.75 3.05109 10.671 2.86032 10.5303 2.71967C10.3897 2.57902 10.1989 2.5 10 2.5C9.80109 2.5 9.61032 2.57902 9.46967 2.71967C9.32902 2.86032 9.25 3.05109 9.25 3.25V4.75C9.25 4.94891 9.32902 5.13968 9.46967 5.28033C9.61032 5.42098 9.80109 5.5 10 5.5C10.1989 5.5 10.3897 5.42098 10.5303 5.28033C10.671 5.13968 10.75 4.94891 10.75 4.75V3.25ZM10 6.5C9.46957 6.5 8.96086 6.71071 8.58579 7.08579C8.21071 7.46086 8 7.96957 8 8.5C8 9.03043 8.21071 9.53914 8.58579 9.91421C8.96086 10.2893 9.46957 10.5 10 10.5C10.5304 10.5 11.0391 10.2893 11.4142 9.91421C11.7893 9.53914 12 9.03043 12 8.5C12 7.96957 11.7893 7.46086 11.4142 7.08579C11.0391 6.71071 10.5304 6.5 10 6.5ZM3.75 10.5C3.21957 10.5 2.71086 10.7107 2.33579 11.0858C1.96071 11.4609 1.75 11.9696 1.75 12.5C1.75 13.0304 1.96071 13.5391 2.33579 13.9142C2.71086 14.2893 3.21957 14.5 3.75 14.5C4.28043 14.5 4.78914 14.2893 5.16421 13.9142C5.53929 13.5391 5.75 13.0304 5.75 12.5C5.75 11.9696 5.53929 11.4609 5.16421 11.0858C4.78914 10.7107 4.28043 10.5 3.75 10.5ZM16.25 10.5C15.7196 10.5 15.2109 10.7107 14.8358 11.0858C14.4607 11.4609 14.25 11.9696 14.25 12.5C14.25 13.0304 14.4607 13.5391 14.8358 13.9142C15.2109 14.2893 15.7196 14.5 16.25 14.5C16.7804 14.5 17.2891 14.2893 17.6642 13.9142C18.0393 13.5391 18.25 13.0304 18.25 12.5C18.25 11.9696 18.0393 11.4609 17.6642 11.0858C17.2891 10.7107 16.7804 10.5 16.25 10.5Z'
                                                        fill='white'
                                                    />
                                                </svg>
                                                <div>Sort</div>
                                                {/* caret icon */}
                                                <svg
                                                    xmlns='http://www.w3.org/2000/svg'
                                                    width='13'
                                                    height='13'
                                                    viewBox='0 0 13 13'
                                                    fill='none'
                                                >
                                                    <path
                                                        fillRule='evenodd'
                                                        clipRule='evenodd'
                                                        d='M3.39257 5.3429C3.48398 5.25161 3.60788 5.20033 3.73707 5.20033C3.86626 5.20033 3.99016 5.25161 4.08157 5.3429L6.49957 7.7609L8.91757 5.3429C8.9622 5.29501 9.01602 5.25659 9.07582 5.22995C9.13562 5.2033 9.20017 5.18897 9.26563 5.18782C9.33109 5.18667 9.39611 5.19871 9.45681 5.22322C9.51751 5.24774 9.57265 5.28424 9.61895 5.33053C9.66524 5.37682 9.70173 5.43196 9.72625 5.49267C9.75077 5.55337 9.76281 5.61839 9.76166 5.68384C9.7605 5.7493 9.74617 5.81385 9.71953 5.87365C9.69288 5.93345 9.65447 5.98727 9.60657 6.0319L6.84407 8.7944C6.75266 8.8857 6.62876 8.93698 6.49957 8.93698C6.37038 8.93698 6.24648 8.8857 6.15507 8.7944L3.39257 6.0319C3.30128 5.9405 3.25 5.81659 3.25 5.6874C3.25 5.55822 3.30128 5.43431 3.39257 5.3429Z'
                                                        fill='white'
                                                        fillOpacity='0.37'
                                                    />
                                                </svg>
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className='flex flex-col gap-1 z-99999' sideOffset={8}>
                                            <div className='text-xs opacity-50 text-center'>
                                                More options coming soon!
                                            </div>

                                            {/* Sort options */}
                                            <DropdownMenuItem onSelect={() => handleSortOptionChange('default')}>
                                                {sortOption === 'default' ? '• ' : ''}
                                                Date of creation
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => handleSortOptionChange('name_asc')}>
                                                {sortOption === 'name_asc' ? '• ' : ''}
                                                Alphabetical
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => handleSortOptionChange('custom')}>
                                                {sortOption === 'custom' ? '• ' : ''}
                                                Custom
                                            </DropdownMenuItem>

                                            {/* Edit Order / Save Order button - shown when custom is selected */}
                                            {sortOption === 'custom' && (
                                                <>
                                                    <div className='border-t border-[#ffffff12] my-1' />
                                                    <DropdownMenuItem
                                                        onSelect={() => {
                                                            if (isEditingOrder) {
                                                                handleSaveOrder();
                                                            } else {
                                                                setIsEditingOrder(true);
                                                            }
                                                        }}
                                                        disabled={isSavingOrder}
                                                    >
                                                        {isSavingOrder ? (
                                                            <>
                                                                <svg
                                                                    className='animate-spin h-4 w-4 mr-2'
                                                                    xmlns='http://www.w3.org/2000/svg'
                                                                    fill='none'
                                                                    viewBox='0 0 24 24'
                                                                >
                                                                    <circle
                                                                        className='opacity-25'
                                                                        cx='12'
                                                                        cy='12'
                                                                        r='10'
                                                                        stroke='currentColor'
                                                                        strokeWidth='4'
                                                                    />
                                                                    <path
                                                                        className='opacity-75'
                                                                        fill='currentColor'
                                                                        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                                                                    />
                                                                </svg>
                                                                Saving...
                                                            </>
                                                        ) : isEditingOrder ? (
                                                            <>
                                                                <svg
                                                                    xmlns='http://www.w3.org/2000/svg'
                                                                    width='16'
                                                                    height='16'
                                                                    viewBox='0 0 24 24'
                                                                    fill='none'
                                                                    stroke='currentColor'
                                                                    strokeWidth='2'
                                                                    strokeLinecap='round'
                                                                    strokeLinejoin='round'
                                                                    className='mr-2'
                                                                >
                                                                    <polyline points='20 6 9 17 4 12' />
                                                                </svg>
                                                                Save Order
                                                            </>
                                                        ) : (
                                                            <>
                                                                <svg
                                                                    xmlns='http://www.w3.org/2000/svg'
                                                                    width='16'
                                                                    height='16'
                                                                    viewBox='0 0 24 24'
                                                                    fill='none'
                                                                    stroke='currentColor'
                                                                    strokeWidth='2'
                                                                    strokeLinecap='round'
                                                                    strokeLinejoin='round'
                                                                    className='mr-2'
                                                                >
                                                                    <path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' />
                                                                    <path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' />
                                                                </svg>
                                                                Edit Order
                                                            </>
                                                        )}
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className='inline-flex h-9 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#ffffff11] px-3 py-1.5 text-sm font-medium text-[#ffffff88] transition-all hover:bg-[#ffffff23] hover:text-[#ffffff] focus-visible:outline-hidden'>
                                                {/* Filter icon */}
                                                <svg
                                                    xmlns='http://www.w3.org/2000/svg'
                                                    width='20'
                                                    height='21'
                                                    viewBox='0 0 20 21'
                                                    fill='none'
                                                >
                                                    <path
                                                        d='M17 3.25C17 3.05109 16.921 2.86032 16.7803 2.71967C16.6397 2.57902 16.4489 2.5 16.25 2.5C16.0511 2.5 15.8603 2.57902 15.7197 2.71967C15.579 2.86032 15.5 3.05109 15.5 3.25V8.75C15.5 8.94891 15.579 9.13968 15.7197 9.28033C15.8603 9.42098 16.0511 9.5 16.25 9.5C16.4489 9.5 16.6397 9.42098 16.7803 9.28033C16.921 9.13968 17 8.94891 17 8.75V3.25ZM17 16.25C17 16.0511 16.921 15.8603 16.7803 15.7197C16.6397 15.579 16.4489 15.5 16.25 15.5C16.0511 15.5 15.8603 15.579 15.7197 15.7197C15.579 15.8603 15.5 16.0511 15.5 16.25V17.75C15.5 17.9489 15.579 18.1397 15.7197 18.2803C15.8603 18.421 16.0511 18.5 16.25 18.5C16.4489 18.5 16.6397 18.421 16.7803 18.2803C16.921 18.1397 17 17.9489 17 17.75V16.25ZM3.75 15.5C3.94891 15.5 4.13968 15.579 4.28033 15.7197C4.42098 15.8603 4.5 16.0511 4.5 16.25V17.75C4.5 17.9489 4.42098 18.1397 4.28033 18.2803C4.13968 18.421 3.94891 18.5 3.75 18.5C3.55109 18.5 3.36032 18.421 3.21967 18.2803C3.07902 18.1397 3 17.9489 3 17.75V16.25C3 16.0511 3.07902 15.8603 3.21967 15.7197C3.36032 15.579 3.55109 15.5 3.75 15.5ZM4.5 3.25C4.5 3.05109 4.42098 2.86032 4.28033 2.71967C4.13968 2.57902 3.94891 2.5 3.75 2.5C3.55109 2.5 3.36032 2.57902 3.21967 2.71967C3.07902 2.86032 3 3.05109 3 3.25V8.75C3 8.94891 3.07902 9.13968 3.21967 9.28033C3.36032 9.42098 3.55109 9.5 3.75 9.5C3.94891 9.5 4.13968 9.42098 4.28033 9.28033C4.42098 9.13968 4.5 8.94891 4.5 8.75V3.25ZM10 11.5C10.1989 11.5 10.3897 11.579 10.5303 11.7197C10.671 11.8603 10.75 12.0511 10.75 12.25V17.75C10.75 17.9489 10.671 18.1397 10.5303 18.2803C10.3897 18.421 10.1989 18.5 10 18.5C9.80109 18.5 9.61032 18.421 9.46967 18.2803C9.32902 18.1397 9.25 17.9489 9.25 17.75V12.25C9.25 12.0511 9.32902 11.8603 9.46967 11.7197C9.61032 11.579 9.80109 11.5 10 11.5ZM10.75 3.25C10.75 3.05109 10.671 2.86032 10.5303 2.71967C10.3897 2.57902 10.1989 2.5 10 2.5C9.80109 2.5 9.61032 2.57902 9.46967 2.71967C9.32902 2.86032 9.25 3.05109 9.25 3.25V4.75C9.25 4.94891 9.32902 5.13968 9.46967 5.28033C9.61032 5.42098 9.80109 5.5 10 5.5C10.1989 5.5 10.3897 5.42098 10.5303 5.28033C10.671 5.13968 10.75 4.94891 10.75 4.75V3.25ZM10 6.5C9.46957 6.5 8.96086 6.71071 8.58579 7.08579C8.21071 7.46086 8 7.96957 8 8.5C8 9.03043 8.21071 9.53914 8.58579 9.91421C8.96086 10.2893 9.46957 10.5 10 10.5C10.5304 10.5 11.0391 10.2893 11.4142 9.91421C11.7893 9.53914 12 9.03043 12 8.5C12 7.96957 11.7893 7.46086 11.4142 7.08579C11.0391 6.71071 10.5304 6.5 10 6.5ZM3.75 10.5C3.21957 10.5 2.71086 10.7107 2.33579 11.0858C1.96071 11.4609 1.75 11.9696 1.75 12.5C1.75 13.0304 1.96071 13.5391 2.33579 13.9142C2.71086 14.2893 3.21957 14.5 3.75 14.5C4.28043 14.5 4.78914 14.2893 5.16421 13.9142C5.53929 13.5391 5.75 13.0304 5.75 12.5C5.75 11.9696 5.53929 11.4609 5.16421 11.0858C4.78914 10.7107 4.28043 10.5 3.75 10.5ZM16.25 10.5C15.7196 10.5 15.2109 10.7107 14.8358 11.0858C14.4607 11.4609 14.25 11.9696 14.25 12.5C14.25 13.0304 14.4607 13.5391 14.8358 13.9142C15.2109 14.2893 15.7196 14.5 16.25 14.5C16.7804 14.5 17.2891 14.2893 17.6642 13.9142C18.0393 13.5391 18.25 13.0304 18.25 12.5C18.25 11.9696 18.0393 11.4609 17.6642 11.0858C17.2891 10.7107 16.7804 10.5 16.25 10.5Z'
                                                        fill='white'
                                                    />
                                                </svg>
                                                <div>Filter</div>
                                                {/* caret icon */}
                                                <svg
                                                    xmlns='http://www.w3.org/2000/svg'
                                                    width='13'
                                                    height='13'
                                                    viewBox='0 0 13 13'
                                                    fill='none'
                                                >
                                                    <path
                                                        fillRule='evenodd'
                                                        clipRule='evenodd'
                                                        d='M3.39257 5.3429C3.48398 5.25161 3.60788 5.20033 3.73707 5.20033C3.86626 5.20033 3.99016 5.25161 4.08157 5.3429L6.49957 7.7609L8.91757 5.3429C8.9622 5.29501 9.01602 5.25659 9.07582 5.22995C9.13562 5.2033 9.20017 5.18897 9.26563 5.18782C9.33109 5.18667 9.39611 5.19871 9.45681 5.22322C9.51751 5.24774 9.57265 5.28424 9.61895 5.33053C9.66524 5.37682 9.70173 5.43196 9.72625 5.49267C9.75077 5.55337 9.76281 5.61839 9.76166 5.68384C9.7605 5.7493 9.74617 5.81385 9.71953 5.87365C9.69288 5.93345 9.65447 5.98727 9.60657 6.0319L6.84407 8.7944C6.75266 8.8857 6.62876 8.93698 6.49957 8.93698C6.37038 8.93698 6.24648 8.8857 6.15507 8.7944L3.39257 6.0319C3.30128 5.9405 3.25 5.81659 3.25 5.6874C3.25 5.55822 3.30128 5.43431 3.39257 5.3429Z'
                                                        fill='white'
                                                        fillOpacity='0.37'
                                                    />
                                                </svg>
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className='flex flex-col gap-1 z-99999' sideOffset={8}>
                                            <div className='text-xs opacity-50 text-center'>
                                                More filters coming soon!
                                            </div>

                                            {/* Existing admin filter */}
                                            {rootAdmin && (
                                                <>
                                                    <DropdownMenuItem
                                                        onSelect={() => setServerViewMode('admin-all')}
                                                        className={serverViewMode === 'admin-all' ? 'bg-accent/20' : ''}
                                                    >
                                                        All Servers (Admin)
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                            <DropdownMenuItem
                                                onSelect={() => setServerViewMode('all')}
                                                className={serverViewMode === 'all' ? 'bg-accent/20' : ''}
                                            >
                                                All Servers
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    <TabsList>
                                        <TabsTrigger aria-label='View servers in a list layout.' value='list'>
                                            <Bars width={18} height={20} color='white' />
                                        </TabsTrigger>
                                        <TabsTrigger aria-label='View servers in a grid layout.' value='grid'>
                                            <LayoutCellsLarge width={20} height={20} color='white' />
                                        </TabsTrigger>
                                    </TabsList>
                                </div>
                            }
                        />
                    </div>

                    {!sortedServers ? (
                        <div className='flex items-center justify-center py-12'>
                            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-brand' />
                        </div>
                    ) : (
                        <>
                            <TabsContent value='list'>
                                <Pagination data={sortedServers} onPageSelect={setPage}>
                                    {({ items }) =>
                                        items.length > 0 ? (
                                            isEditingOrder ? (
                                                <DndContext
                                                    sensors={sensors}
                                                    collisionDetection={closestCenter}
                                                    onDragStart={handleDragStart}
                                                    onDragEnd={handleDragEnd}
                                                >
                                                    <SortableContext
                                                        items={items.map((s) => s.uuid)}
                                                        strategy={verticalListSortingStrategy}
                                                    >
                                                        <PageListContainer>
                                                            {items.map((server, index) => (
                                                                <SortableServerRow
                                                                    key={server.uuid}
                                                                    server={server}
                                                                    className='flex-row'
                                                                    index={index}
                                                                />
                                                            ))}
                                                        </PageListContainer>
                                                    </SortableContext>
                                                    <DragOverlay>
                                                        {activeId ? (
                                                            <div className='opacity-90'>
                                                                <ServerRow
                                                                    className='flex-row'
                                                                    server={items.find((s) => s.uuid === activeId)!}
                                                                    isEditMode={true}
                                                                />
                                                            </div>
                                                        ) : null}
                                                    </DragOverlay>
                                                </DndContext>
                                            ) : (
                                                <PageListContainer>
                                                    {items.map((server, index) => (
                                                        <div
                                                            key={server.uuid}
                                                            className='transform-gpu skeleton-anim-2'
                                                            style={{
                                                                animationDelay: `${index * 50 + 50}ms`,
                                                                animationTimingFunction:
                                                                    'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                                                            }}
                                                        >
                                                            <ServerRow
                                                                className='flex-row'
                                                                key={server.uuid}
                                                                server={server}
                                                            />
                                                        </div>
                                                    ))}
                                                </PageListContainer>
                                            )
                                        ) : (
                                            <div className='flex flex-col items-center justify-center py-12 px-4'>
                                                <div className='text-center'>
                                                    <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-[#ffffff11] flex items-center justify-center'>
                                                        <House width={28} height={28} color='white' />
                                                    </div>
                                                    <h3 className='text-lg font-medium text-zinc-200 mb-2'>
                                                        {serverViewMode === 'admin-all'
                                                            ? 'No other servers found'
                                                            : 'No servers found'}
                                                    </h3>
                                                    <p className='text-sm text-zinc-400 max-w-sm'>
                                                        {serverViewMode === 'admin-all'
                                                            ? 'There are no other servers to display.'
                                                            : 'There are no servers associated with your account.'}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    }
                                </Pagination>
                            </TabsContent>

                            <TabsContent value='grid'>
                                <Pagination data={sortedServers} onPageSelect={setPage}>
                                    {({ items }) =>
                                        items.length > 0 ? (
                                            isEditingOrder ? (
                                                <DndContext
                                                    sensors={sensors}
                                                    collisionDetection={closestCenter}
                                                    onDragStart={handleDragStart}
                                                    onDragEnd={handleDragEnd}
                                                >
                                                    <SortableContext
                                                        items={items.map((s) => s.uuid)}
                                                        strategy={verticalListSortingStrategy}
                                                    >
                                                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                                            {items.map((server, index) => (
                                                                <SortableServerRow
                                                                    key={server.uuid}
                                                                    server={server}
                                                                    className='items-start! flex-col w-full gap-4 [&>div~div]:w-full'
                                                                    index={index}
                                                                />
                                                            ))}
                                                        </div>
                                                    </SortableContext>
                                                    <DragOverlay>
                                                        {activeId ? (
                                                            <div className='opacity-90 w-full max-w-md'>
                                                                <ServerRow
                                                                    className='items-start! flex-col w-full gap-4 [&>div~div]:w-full'
                                                                    server={items.find((s) => s.uuid === activeId)!}
                                                                    isEditMode={true}
                                                                />
                                                            </div>
                                                        ) : null}
                                                    </DragOverlay>
                                                </DndContext>
                                            ) : (
                                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                                    {items.map((server, index) => (
                                                        <div
                                                            key={server.uuid}
                                                            className='transform-gpu skeleton-anim-2'
                                                            style={{
                                                                animationDelay: `${index * 50 + 50}ms`,
                                                                animationTimingFunction:
                                                                    'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                                                            }}
                                                        >
                                                            <ServerRow
                                                                className='items-start! flex-col w-full gap-4 [&>div~div]:w-full'
                                                                key={server.uuid}
                                                                server={server}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            )
                                        ) : (
                                            <div className='flex flex-col items-center justify-center py-12 px-4'>
                                                <div className='text-center'>
                                                    <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-[#ffffff11] flex items-center justify-center'>
                                                        <House width={28} height={28} color='white' />
                                                    </div>
                                                    <h3 className='text-lg font-medium text-zinc-200 mb-2'>
                                                        {serverViewMode === 'admin-all'
                                                            ? 'No other servers found'
                                                            : 'No servers found'}
                                                    </h3>
                                                    <p className='text-sm text-zinc-400 max-w-sm'>
                                                        {serverViewMode === 'admin-all'
                                                            ? 'There are no other servers to display.'
                                                            : 'There are no servers associated with your account.'}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    }
                                </Pagination>
                            </TabsContent>
                        </>
                    )}
                </Tabs>
            </div>
        </PageContentBlock>
    );
};

export default DashboardContainer;
