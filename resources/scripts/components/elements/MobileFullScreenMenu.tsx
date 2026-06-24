import { AbbrApi, Gear, House, Key, Xmark } from '@gravity-ui/icons';
import type React from 'react';
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { getSubdomainInfo } from '@/api/server/network/subdomain';
import Can from '@/components/elements/Can';
import type { FeatureLimitKey, ServerRouteDefinition } from '@/routers/routes';
import { getServerNavRoutes } from '@/routers/routes';

import { ServerContext } from '@/state/server';

interface MobileFullScreenMenuProps {
    children: React.ReactNode;
    isVisible: boolean;
    onClose: () => void;
}

const MobileFullScreenMenu = ({ isVisible, onClose, children }: MobileFullScreenMenuProps) => {
    if (!isVisible) return null;

    return (
        <div className='fixed inset-0 z-9999 bg-[#1a1a1a] pt-16 lg:hidden'>
            {/* Close button */}
            <button
                aria-label='Close menu'
                className='absolute top-4 right-4 rounded-lg p-2 text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white'
                onClick={onClose}
            >
                <Xmark fill='currentColor' height={22} width={22} />
            </button>

            {/* Full screen navigation menu */}
            <div className='h-full overflow-y-auto'>
                <div className='p-6'>
                    {/* Menu items */}
                    <nav className='space-y-2'>{children}</nav>
                </div>
            </div>
        </div>
    );
};

interface NavigationItemProps {
    children: React.ReactNode;
    end?: boolean;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    onClick: () => void;
    to: string;
}

const NavigationItem = ({ to, icon: Icon, children, end = false, onClick }: NavigationItemProps) => (
    <NavLink
        className={({ isActive }) =>
            `flex items-center gap-4 rounded-md p-4 transition-all duration-200 ${
                isActive
                    ? 'border-brand border-l-4 bg-gradient-to-r from-brand/20 to-brand/10 text-white'
                    : 'border-transparent border-l-4 text-white/80 hover:bg-[#ffffff11] hover:text-white'
            }`
        }
        end={end}
        onClick={onClick}
        to={to}
    >
        <div>
            <Icon fill='currentColor' height={22} width={22} />
        </div>
        <span className='font-medium text-lg'>{children}</span>
    </NavLink>
);

interface DashboardMobileMenuProps {
    isVisible: boolean;
    onClose: () => void;
}

export const DashboardMobileMenu = ({ isVisible, onClose }: DashboardMobileMenuProps) => (
    <MobileFullScreenMenu isVisible={isVisible} onClose={onClose}>
        <NavigationItem end icon={House} onClick={onClose} to='/'>
            Servers
        </NavigationItem>
        <NavigationItem end icon={AbbrApi} onClick={onClose} to='/account/api'>
            API Keys
        </NavigationItem>
        <NavigationItem end icon={Key} onClick={onClose} to='/account/ssh'>
            SSH Keys
        </NavigationItem>
        <NavigationItem end icon={Gear} onClick={onClose} to='/account'>
            Settings
        </NavigationItem>
    </MobileFullScreenMenu>
);

interface ServerMobileNavItemProps {
    onClose: () => void;
    route: ServerRouteDefinition;
    serverId: string;
}

/**
 * Mobile navigation item that handles permission and feature limit checks.
 */
const ServerMobileNavItem = ({ route, serverId, onClose }: ServerMobileNavItemProps) => {
    const { icon: Icon, name, path, permission, featureLimit, end } = route;

    // Feature limits from server state
    const featureLimits = ServerContext.useStoreState((state) => state.server.data?.featureLimits);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);

    // State for subdomain support check (only for network route)
    const [subdomainSupported, setSubdomainSupported] = useState(false);

    // Check subdomain support for network feature
    useEffect(() => {
        if (featureLimit !== 'network' || !uuid) return;

        const checkSubdomainSupport = async () => {
            try {
                const data = await getSubdomainInfo(uuid);
                setSubdomainSupported(data.supported);
            } catch {
                setSubdomainSupported(false);
            }
        };

        checkSubdomainSupport();
    }, [featureLimit, uuid]);

    // Check if the item should be visible based on feature limits
    const isVisible = (): boolean => {
        if (!featureLimit) return true;

        if (featureLimit === 'network') {
            const allocationLimit = featureLimits?.allocations ?? 0;
            return allocationLimit > 0 || subdomainSupported;
        }

        const limitValue = featureLimits?.[featureLimit as FeatureLimitKey] ?? 0;
        return limitValue !== 0;
    };

    if (!(isVisible() && Icon && name)) return null;

    const to = path ? `/server/${serverId}/${path}` : `/server/${serverId}`;

    const NavContent = (
        <NavigationItem end={end} icon={Icon} onClick={onClose} to={to}>
            {name}
        </NavigationItem>
    );

    if (permission === null || permission === undefined) {
        return NavContent;
    }

    return (
        <Can action={permission} matchAny>
            {NavContent}
        </Can>
    );
};

interface ServerMobileMenuProps {
    allocationLimit?: number | null;
    backupLimit?: number | null;
    // These props are kept for backwards compatibility but are no longer used
    // The component now reads feature limits directly from ServerContext
    databaseLimit?: number | null;
    isVisible: boolean;
    onClose: () => void;
    serverId?: string;
    subdomainSupported?: boolean;
}

export const ServerMobileMenu = ({ isVisible, onClose, serverId }: ServerMobileMenuProps) => {
    if (!serverId) return null;

    // Get navigation routes from centralized config
    const navRoutes = getServerNavRoutes();

    return (
        <MobileFullScreenMenu isVisible={isVisible} onClose={onClose}>
            {navRoutes.map((route) => (
                <ServerMobileNavItem key={route.path || 'home'} onClose={onClose} route={route} serverId={serverId} />
            ))}
        </MobileFullScreenMenu>
    );
};

export default MobileFullScreenMenu;
