import {
    ArrowDown01Icon,
    Logout03Icon,
    ServerStack02Icon,
    Settings02Icon,
    UserShield02Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useStoreState } from 'easy-peasy';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import http from '@/api/http';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { sha256Hash } from '@/lib/helpers';

import { Button } from '../../ui/button';

export interface UserDropdownMenuItem {
    badge?: string;
    icon?: React.ComponentType<any>;
    id: string;
    label?: string;
    link?: {
        href: string;
        external?: boolean;
    };
    onSelect?: () => void;
    showWhen?: boolean;
    type?: 'item' | 'separator';
}

interface UserDropdownProps {
    serverId?: string;
}

export default function UserDropdown({ serverId }: UserDropdownProps) {
    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const email = useStoreState((state) => state.user.data!.email);
    const navigate = useNavigate();
    const [emailHash, setEmailHash] = useState<string>('');

    useEffect(() => {
        const computeEmailHash = async () => {
            const hash = await sha256Hash(email.toLowerCase().trim());
            setEmailHash(hash);
        };

        if (email) {
            computeEmailHash();
        }
    }, [email]);

    const onTriggerLogout = () => {
        http.post('/auth/logout').finally(() => {
            // @ts-expect-error this is valid
            window.location = '/';
        });
    };

    const defaultMenuItems: UserDropdownMenuItem[] = [
        {
            id: 'user-settings',
            label: 'Settings',
            icon: () => <HugeiconsIcon icon={Settings02Icon} size={16} strokeWidth={2} />,
            link: {
                href: '/account',
                external: false,
            },
            type: 'item',
        },
        {
            id: 'admin-separator',
            type: 'separator',
            showWhen: rootAdmin,
        },
        {
            id: 'admin-panel',
            label: 'Admin Panel',
            icon: () => <HugeiconsIcon icon={UserShield02Icon} size={16} strokeWidth={2} />,
            badge: 'Staff',
            link: {
                href: '/admin',
                external: true,
            },
            showWhen: rootAdmin,
            type: 'item',
        },
        {
            id: 'logout',
            label: 'Log Out',
            icon: () => <HugeiconsIcon icon={Logout03Icon} size={16} strokeWidth={2} />,
            onSelect: onTriggerLogout,
            type: 'item',
        },
    ];

    const menuItems = [...defaultMenuItems];

    // add server management item if serverId is provided
    if (serverId && rootAdmin) {
        const manageServerItem: UserDropdownMenuItem = {
            id: 'manage-server',
            label: 'Manage Server',
            icon: () => <HugeiconsIcon icon={ServerStack02Icon} size={16} strokeWidth={2} />,
            link: {
                href: `/admin/servers/view/${serverId}`,
                external: true,
            },
            badge: 'Staff',
            type: 'item',
        };

        // insert after admin separator
        const adminSeparatorIndex = menuItems.findIndex((item) => item.id === 'admin-separator');
        if (adminSeparatorIndex === -1) {
            // if no admin separator, add at the beginning
            menuItems.unshift(manageServerItem);
        } else {
            menuItems.splice(adminSeparatorIndex + 1, 0, manageServerItem);
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button className='gap-1 rounded-full px-1' size={'sm'} variant={'secondary'}>
                    <div className='flex flex-row items-center gap-1.5'>
                        <div className='grid aspect-square size-5 place-content-center overflow-hidden rounded-full border border-mocha-400 bg-mocha-400'>
                            <img
                                alt='User avatar'
                                className='h-full w-full object-cover'
                                draggable={false}
                                src={`https://www.gravatar.com/avatar/${emailHash}?d=identicon&s=32`}
                            />
                        </div>
                        {email}
                    </div>
                    <HugeiconsIcon icon={ArrowDown01Icon} size={16} strokeWidth={2} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='z-99999' sideOffset={8}>
                {menuItems
                    .filter((item) => item.showWhen !== false)
                    .map((item) => {
                        if (item.type === 'separator') {
                            return <DropdownMenuSeparator key={item.id} />;
                        }

                        const IconComponent = item.icon;

                        const handleSelect = () => {
                            if (item.link) {
                                if (item.link.external) {
                                    window.open(item.link.href, '_blank');
                                } else {
                                    navigate(item.link.href);
                                }
                            } else if (item.onSelect) {
                                item.onSelect();
                            }
                        };

                        return (
                            <DropdownMenuItem
                                className={`flex items-center gap-2 ${item.link?.external ? 'cursor-pointer' : ''}`}
                                key={item.id}
                                onSelect={handleSelect}
                            >
                                {IconComponent && <IconComponent className='size-4' />}
                                {item.label}
                                {item.badge && (
                                    <span className='z-10 ml-auto rounded-full bg-brand px-2 py-1 text-white text-xs'>
                                        {item.badge}
                                    </span>
                                )}
                            </DropdownMenuItem>
                        );
                    })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
