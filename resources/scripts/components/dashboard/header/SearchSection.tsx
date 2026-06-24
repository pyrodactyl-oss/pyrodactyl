import { Search01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { memo, useEffect, useRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import { KeyboardShortcut } from '@/components/ui/keyboard-shortcut';

const SearchIcon = memo(() => (
    <HugeiconsIcon
        className='absolute top-1/2 left-4 -translate-y-1/2 transform text-cream-500/30'
        icon={Search01Icon}
        size={16}
        strokeWidth={2}
    />
));
SearchIcon.displayName = 'SearchIcon';

interface SearchSectionProps {
    className?: string;
}

const SearchSection = memo(({ className }: SearchSectionProps) => {
    const [searchValue, setSearchValue] = useState('');

    const inputRef = useRef(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    return (
        <div className={`group flex h-full items-center gap-2 ${className || ''}`}>
            <div className='group relative mx-auto w-3/4 transition-all duration-200 ease-out group-focus-within:w-full'>
                <Input
                    className='mx-auto w-full pr-16 pl-10 transition-all duration-200 ease-out group-focus-within:w-full'
                    id='header-search'
                    onChange={(e) => {
                        setSearchValue(e.target.value);
                    }}
                    placeholder='Search servers...'
                    ref={inputRef}
                    type='text'
                    value={searchValue}
                />
                <SearchIcon />
                {!searchValue && (
                    <div className='pointer-events-none absolute top-1/2 right-4 flex -translate-y-1/2 transform align-middle transition-all duration-200 ease-out group-focus-within:opacity-0'>
                        <KeyboardShortcut keys={['cmd', 'k']} variant='faded' />
                    </div>
                )}
            </div>
        </div>
    );
});

SearchSection.displayName = 'SearchSection';

export default SearchSection;
