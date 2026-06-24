import type { IconSvgElement } from '@hugeicons/react';
import { memo, type RefObject, useCallback, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import { cn } from '@/lib/utils';

import NavItem from './NavItem';
import './sidebar-logo.css';
import './sidebar-modern.css';

interface NavItem {
    end: boolean;
    icon: IconSvgElement;
    minimizedText?: string;
    permission?: string | string[];
    ref: RefObject<HTMLAnchorElement | null>;
    tabName: string;
    text: string;
    to: string;
}

interface SidebarProps {
    className?: string;
    navItems: NavItem[];
    onNavClick?: () => void;
}

export default memo(function Sidebar({ navItems, className, onNavClick }: SidebarProps) {
    const location = useLocation();

    // dynamic CSS for hover and active states on mount
    useEffect(() => {
        const styleId = 'sidebar-dynamic-styles';

        const existingStyle = document.getElementById(styleId);
        if (existingStyle) {
            existingStyle.remove();
        }

        const maxItems = navItems.length;
        let css = '';

        // hover effects for indicator positioning
        for (let i = 1; i <= maxItems; i++) {
            css += `
                .sidebar-container:has(li:nth-child(${i}):hover) .sidebar-indicator {
                    top: calc(var(--sidebar-initial-top) + (var(--nav-item-height) + var(--nav-item-spacing)) * ${i - 1}) !important;
                }
            `;
        }

        // active indicator positions
        for (let i = 1; i <= maxItems; i++) {
            css += `
                .sidebar-container:not(:has(li:hover)):has(li[data-active='true']:nth-child(${i})) .sidebar-indicator {
                    top: calc(var(--sidebar-initial-top) + (var(--nav-item-height) + var(--nav-item-spacing)) * ${i - 1}) !important;
                }
            `;
        }

        // inject
        const styleElement = document.createElement('style');
        styleElement.id = styleId;
        styleElement.textContent = css;
        document.head.appendChild(styleElement);

        // cleanup
        return () => {
            const style = document.getElementById(styleId);
            if (style) {
                style.remove();
            }
        };
    }, [navItems.length]);

    // stable path to tab mapping
    const pathToTabMapping = useMemo(
        () =>
            navItems.map((item) => ({
                pattern: (path: string) => {
                    if (item.to === '/' && item.end) {
                        return path.endsWith('/');
                    }
                    return path.endsWith(item.to);
                },
                tabName: item.tabName,
                ref: item.ref,
            })),
        [navItems],
    );

    // current active tab
    const currentActiveTab = useMemo(() => {
        const match = pathToTabMapping.find(({ pattern }) => pattern(location.pathname));
        return match?.tabName || null;
    }, [pathToTabMapping, location.pathname]);

    // stable callback for nav clicks
    const handleNavClick = useCallback(() => {
        onNavClick?.();
    }, [onNavClick]);

    return (
        <div
            className={cn(
                'sidebar-container relative shrink-0 select-none flex-col overflow-y-auto rounded-lg px-8',
                className,
            )}
        >
            <div className='sidebar-indicator pointer-events-none absolute left-[2rem] rounded-xl border border-mocha-300 bg-mocha-400' />
            <ul className='flex flex-col text-sm'>
                {navItems.map((item, index) => {
                    const isActive = currentActiveTab === item.tabName;
                    return (
                        <li data-active={isActive} data-tab={item.tabName} key={item.tabName}>
                            <NavItem
                                end={item.end}
                                icon={item.icon}
                                itemRef={item.ref}
                                lastItem={index === navItems.length - 1}
                                onNavClick={handleNavClick}
                                permission={item.permission}
                                text={item.text}
                                to={item.to}
                            />
                        </li>
                    );
                })}
            </ul>
        </div>
    );
});
