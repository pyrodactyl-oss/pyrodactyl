import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { memo } from 'react';
import { NavLink } from 'react-router-dom';

import Can from '@/components/elements/Can';

interface RenderedNavItem {
    end: boolean;
    icon: IconSvgElement;
    itemRef: React.RefObject<HTMLAnchorElement | null>;
    lastItem?: boolean;
    onNavClick?: () => void;
    permission?: string | string[];
    text: string;
    to: string;
}

const NavItem = memo(({ to, icon, text, itemRef, end, permission, onNavClick }: RenderedNavItem) => {
    const navLink = (
        <NavLink
            className='nav-item relative flex select-none items-center font-medium opacity-40 duration-200'
            draggable={false}
            end={end}
            onClick={onNavClick}
            ref={itemRef}
            to={to}
        >
            <HugeiconsIcon className='nav-icon size-5 shrink-0 transition-transform' icon={icon} strokeWidth={2} />
            <p className='nav-text text-nowrap text-sm transition-transform'>{text}</p>
        </NavLink>
    );

    // if permission specified, wrap in Can component
    if (permission) {
        return (
            <Can action={permission} matchAny>
                {navLink}
            </Can>
        );
    }

    return navLink;
});

NavItem.displayName = 'NavItem';

export default NavItem;
