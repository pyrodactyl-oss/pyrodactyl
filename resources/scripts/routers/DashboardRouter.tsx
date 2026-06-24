import { Ellipsis, Gear, House, Key, Lock } from '@gravity-ui/icons';
import { useStoreState } from 'easy-peasy';
import { Fragment, Suspense, useEffect, useRef, useState } from 'react';
import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import http from '@/api/http';

import DashboardContainer from '@/components/dashboard/DashboardContainer';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/elements/DropdownMenu';
import MainSidebar from '@/components/elements/MainSidebar';
import MainWrapper from '@/components/elements/MainWrapper';
import { DashboardMobileMenu } from '@/components/elements/MobileFullScreenMenu';
import MobileTopBar from '@/components/elements/MobileTopBar';
import Logo from '@/components/elements/PyroLogo';
import { NotFound } from '@/components/elements/ScreenBlock';
import routes from '@/routers/routes';

const DashboardRouter = () => {
    const location = useLocation();
    const rootAdmin = useStoreState((state) => state.user.data?.rootAdmin);

    // Mobile menu state
    const [isMobileMenuVisible, setMobileMenuVisible] = useState(false);

    const toggleMobileMenu = () => {
        setMobileMenuVisible(!isMobileMenuVisible);
    };

    const closeMobileMenu = () => {
        setMobileMenuVisible(false);
    };

    const onTriggerLogout = () => {
        http.post('/auth/logout').finally(() => {
            // @ts-expect-error this is valid
            window.location = '/';
        });
    };

    const onSelectAdminPanel = () => {
        window.open('/admin');
    };

    // Define refs for navigation buttons.
    const NavigationHome = useRef(null);
    const NavigationSettings = useRef(null);
    const NavigationApi = useRef(null);
    const NavigationSSH = useRef(null);

    const calculateTop = (pathname: string) => {
        // Get currents of navigation refs.
        const ButtonHome = NavigationHome.current;
        const ButtonSettings = NavigationSettings.current;
        const ButtonApi = NavigationApi.current;
        const ButtonSSH = NavigationSSH.current;

        // Perfectly center the page highlighter with simple math.
        // Height of navigation links (56) minus highlight height (40) equals 16. 16 devided by 2 is 8.
        const HighlightOffset: number = 8;

        if (pathname.endsWith('/') && ButtonHome != null) return (ButtonHome as any).offsetTop + HighlightOffset;
        if (pathname.endsWith('/account') && ButtonSettings != null)
            return (ButtonSettings as any).offsetTop + HighlightOffset;
        if (pathname.endsWith('/api') && ButtonApi != null) return (ButtonApi as any).offsetTop + HighlightOffset;
        if (pathname.endsWith('/ssh') && ButtonSSH != null) return (ButtonSSH as any).offsetTop + HighlightOffset;
        return '0';
    };

    const top = calculateTop(location.pathname);

    const [height, setHeight] = useState('40px');

    useEffect(() => {
        setHeight('34px');
        const timeoutId = setTimeout(() => setHeight('40px'), 200);
        return () => clearTimeout(timeoutId);
    }, []);

    return (
        <Fragment key={'dashboard-router'}>
            {/* Mobile Top Bar */}
            <MobileTopBar
                onMenuToggle={toggleMobileMenu}
                onSelectAdminPanel={onSelectAdminPanel}
                onTriggerLogout={onTriggerLogout}
                rootAdmin={rootAdmin}
            />

            {/* Mobile Full Screen Menu */}
            <DashboardMobileMenu isVisible={isMobileMenuVisible} onClose={closeMobileMenu} />

            <div className='flex w-full flex-row pt-16 lg:pt-0'>
                {/* Desktop Sidebar */}
                <MainSidebar className='hidden w-[300px] bg-[#1a1a1a] lg:relative lg:flex lg:shrink-0'>
                    <div
                        className='pointer-events-none absolute left-0 h-10 w-[3px] rounded-full bg-brand'
                        style={{
                            top,
                            height,
                            opacity: top === '0' ? 0 : 1,
                            transition:
                                'linear(0,0.006,0.025 2.8%,0.101 6.1%,0.539 18.9%,0.721 25.3%,0.849 31.5%,0.937 38.1%,0.968 41.8%,0.991 45.7%,1.006 50.1%,1.015 55%,1.017 63.9%,1.001) 390ms',
                        }}
                    />
                    <div
                        className='pointer-events-none absolute left-0 h-10 w-12 rounded-full bg-brand blur-2xl'
                        style={{
                            top,
                            opacity: top === '0' ? 0 : 0.5,
                            transition:
                                'top linear(0,0.006,0.025 2.8%,0.101 6.1%,0.539 18.9%,0.721 25.3%,0.849 31.5%,0.937 38.1%,0.968 41.8%,0.991 45.7%,1.006 50.1%,1.015 55%,1.017 63.9%,1.001) 390ms',
                        }}
                    />
                    <div className='relative flex h-8 flex-row items-center justify-between'>
                        <NavLink className='flex h-8 w-fit shrink-0' to={'/'}>
                            <Logo uniqueId='desktop-sidebar' />
                            {/* <h1 className='text-[35px] font-semibold leading-[98%] tracking-[-0.05rem] mb-8'>Panel</h1> */}
                        </NavLink>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className='flex h-10 w-10 cursor-pointer items-center justify-center rounded-md p-2 text-white hover:bg-white/10'>
                                    {' '}
                                    <Ellipsis fill='currentColor' height={22} width={26} />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className='z-99999' sideOffset={8}>
                                {rootAdmin && (
                                    <DropdownMenuItem onSelect={onSelectAdminPanel}>
                                        Admin Panel
                                        <span className='z-10 ml-2 rounded-full bg-brand px-2 py-1 text-white text-xs'>
                                            Staff
                                        </span>
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={onTriggerLogout}>Log Out</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div aria-hidden className='mt-8 mb-4 min-h-[1px] w-6 bg-[#ffffff33]' />
                    <ul className='pyro-subnav-routes-wrapper' data-pyro-subnav-routes-wrapper=''>
                        <NavLink className='flex flex-row items-center' end ref={NavigationHome} to={'/'}>
                            <House fill='currentColor' height={22} width={22} />
                            <p>Servers</p>
                        </NavLink>
                        <NavLink className='flex flex-row items-center' end ref={NavigationApi} to={'/account/api'}>
                            <Lock fill='currentColor' height={22} width={22} />
                            <p>API Keys</p>
                        </NavLink>
                        <NavLink className='flex flex-row items-center' end ref={NavigationSSH} to={'/account/ssh'}>
                            <Key fill='currentColor' height={22} width={22} />
                            <p>SSH Keys</p>
                        </NavLink>
                        <NavLink className='flex flex-row items-center' end ref={NavigationSettings} to={'/account'}>
                            <Gear fill='currentColor' height={22} width={22} />
                            <p>Settings</p>
                        </NavLink>
                    </ul>
                </MainSidebar>

                <Suspense fallback={null}>
                    <MainWrapper className='w-full'>
                        <main
                            className='relative inset-[1px] h-full w-full overflow-y-auto overflow-x-hidden rounded-md bg-[#08080875]'
                            data-pyro-main=''
                            data-pyro-transitionrouter=''
                        >
                            <Routes>
                                <Route element={<DashboardContainer />} path='' />

                                {routes.account.map(({ route, component: Component }) => (
                                    <Route
                                        element={<Component />}
                                        key={route}
                                        path={`/account/${route}`.replace('//', '/')}
                                    />
                                ))}

                                <Route element={<NotFound />} path='*' />
                            </Routes>
                        </main>
                    </MainWrapper>
                </Suspense>
            </div>
        </Fragment>
    );
};

export default DashboardRouter;
