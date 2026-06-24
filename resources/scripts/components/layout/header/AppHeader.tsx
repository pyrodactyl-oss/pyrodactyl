import { LayoutSideContent } from '@gravity-ui/icons';
import { Fragment, memo } from 'react';
import { NavLink } from 'react-router-dom';
// import ActionButton from '@/components/elements/ActionButton';
import Logo from '@/components/elements/PyroLogo';
import { Button } from '@/components/ui/button';
import { useHeader } from '@/contexts/HeaderContext';
import { useSidebar } from '@/contexts/SidebarContext';

import '../sidebar/sidebar-modern.css';
import UserDropdown from './UserDropdown';

interface AppHeaderProps {
    serverId?: string;
}

const HeaderActions = memo(() => {
    const { headerActions } = useHeader();

    if (Array.isArray(headerActions)) {
        return (
            <>
                {headerActions.map((action, index) => (
                    <Fragment key={index}>{action}</Fragment>
                ))}
            </>
        );
    }

    return <>{headerActions}</>;
});

HeaderActions.displayName = 'HeaderActions';

const LogoSection = memo(() => (
    <NavLink aria-label='Home page' className='pyro-logo flex h-4 w-fit shrink-0 items-center' to={'/'}>
        <Logo />
    </NavLink>
));
LogoSection.displayName = 'LogoSection';

const ToggleButton = memo(() => {
    const { toggleMinimized } = useSidebar();

    return (
        <Button
            aria-label='Toggle sidebar'
            className='size-8 gap-1 rounded-full p-1'
            onClick={toggleMinimized}
            size={'sm'}
            variant={'secondary'}
        >
            <LayoutSideContent height={16} width={16} />
        </Button>
    );
});
ToggleButton.displayName = 'ToggleButton';

const SidebarLogo = memo(() => (
    <div className='sidebar-logo-container mx-8 flex h-[48px] flex-none items-center justify-between'>
        <LogoSection />
        <ToggleButton />
    </div>
));
SidebarLogo.displayName = 'SidebarLogo';

const StaticButtons = memo<{ serverId?: string }>(({ serverId }) => {
    return (
        <>
            {/* <Button size={'sm'} variant={'secondary'} className='px-3 gap-1 rounded-full'>
                <div className='flex flex-row items-center gap-1.5'>
                    <HugeiconsIcon size={16} strokeWidth={2} icon={AiSearch02Icon} className='size-4' />
                    Search
                </div>
            </Button> */}
            <UserDropdown serverId={serverId} />
        </>
    );
});

StaticButtons.displayName = 'StaticButtons';

const AppHeader = ({ serverId }: AppHeaderProps) => (
    <div className='flex h-[64px] w-full items-center justify-between py-4 pr-2 align-middle'>
        <SidebarLogo />
        <div className='flex h-full w-full items-center justify-end gap-2'>
            <HeaderActions />
            <StaticButtons serverId={serverId} />
        </div>
    </div>
);

export default AppHeader;
