import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu';
import ChevronDown from './icons/ChevronDown';

interface DropdownLink {
    external?: boolean;
    href: string;
    label: string;
}

interface DropdownNodeItem {
    content: React.ReactNode;
    onClick?: () => void;
}

const GeneralDropdown = ({
    trigger,
    items,
    side,
    offset,
}: {
    trigger: React.ReactNode;
    items: (React.ReactNode | DropdownLink | DropdownNodeItem)[];
    side?: 'top' | 'bottom' | 'left' | 'right';
    offset?: number;
    onClick?: () => void;
}) => {
    const handleItemClick = (item: DropdownLink) => {
        if (item.external) {
            window.open(item.href, '_blank', 'noopener,noreferrer');
        } else {
            window.location.href = item.href;
        }
    };

    const isDropdownLink = (item: React.ReactNode | DropdownLink | DropdownNodeItem): item is DropdownLink =>
        typeof item === 'object' && item !== null && 'label' in item && 'href' in item;

    const isDropdownNodeItem = (item: React.ReactNode | DropdownLink | DropdownNodeItem): item is DropdownNodeItem =>
        typeof item === 'object' && item !== null && 'content' in item;

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger>
                <div className='flex items-center gap-2 rounded-xl border border-cream-400/20 bg-mocha-300/50 px-3 py-1 font-medium text-cream-400 text-sm shadow-sm hover:bg-mocha-300/70 focus:outline-none hover:active:bg-mocha-300/90'>
                    {trigger}
                    <ChevronDown />
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='z-[9999]' side={side} sideOffset={offset}>
                {items.map((item, idx) => {
                    if (isDropdownLink(item)) {
                        return (
                            <DropdownMenuItem
                                className={item.external ? 'cursor-pointer' : undefined}
                                key={idx}
                                onSelect={() => handleItemClick(item)}
                            >
                                {item.label}
                            </DropdownMenuItem>
                        );
                    }
                    if (isDropdownNodeItem(item)) {
                        return (
                            <DropdownMenuItem key={idx} onSelect={item.onClick}>
                                {item.content}
                            </DropdownMenuItem>
                        );
                    }
                    return <DropdownMenuItem key={idx}>{item}</DropdownMenuItem>;
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default GeneralDropdown;
