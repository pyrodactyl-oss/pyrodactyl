import { useEffect, useMemo, useState } from 'react';

import { Checkbox } from '@/components/elements/CheckboxLabel';
import Input from '@/components/elements/Input';

import { ServerContext } from '@/state/server';

import { useGlobalStateContext } from './config';
import { getAvailableLoaders, getLoaderType } from './eggfeatures';

const DEFAULT_LOADERS = ['paper', 'spigot', 'purpur', 'fabric', 'forge', 'quilt', 'bungeecord'];

interface LoaderSelectorProps {
    featuredLoaders?: string[];
    maxVisible?: number;
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export const LoaderSelector = ({ maxVisible = 7, featuredLoaders = DEFAULT_LOADERS }: LoaderSelectorProps) => {
    const { loaders, selectedLoaders, setSelectedLoaders } = useGlobalStateContext();
    const [searchQuery, setSearchQuery] = useState('');
    const [showAll, setShowAll] = useState(false);
    const eggFeatures = ServerContext.useStoreState((state) => state.server.data?.eggFeatures || []);
    const availableLoaders = getAvailableLoaders(eggFeatures);
    const _loaderType = getLoaderType(eggFeatures);

    // selectedLoaders.push(...availableLoaders);
    // setSelectedLoaders([...new Set([...selectedLoaders, ...availableLoaders])]);
    useEffect(() => {
        selectedLoaders.push(...availableLoaders);
    }, [selectedLoaders.push, availableLoaders]);

    const { featured, other, filtered } = useMemo(() => {
        if (!loaders.length) return { featured: [], other: [], filtered: [] };

        const fuzzyMatch = (text: string, query: string) => {
            const cleanText = text.toLowerCase();
            const cleanQuery = query.toLowerCase();
            return cleanText.includes(cleanQuery);
        };

        const filteredLoaders = searchQuery
            ? loaders.filter((loader) => fuzzyMatch(loader.name, searchQuery) || fuzzyMatch(loader.id, searchQuery))
            : loaders;

        const featured: typeof loaders = [];
        const other: typeof loaders = [];

        filteredLoaders.forEach((loader) => {
            if (featuredLoaders.includes(loader.id)) {
                featured.push(loader);
            } else {
                other.push(loader);
            }
        });

        featured.sort((a, b) => {
            const indexA = featuredLoaders.indexOf(a.id);
            const indexB = featuredLoaders.indexOf(b.id);
            return indexA - indexB;
        });

        other.sort((a, b) => a.name.localeCompare(b.name));

        return { featured, other, filtered: filteredLoaders };
    }, [loaders, searchQuery, featuredLoaders]);

    const loadersToShow = useMemo(() => {
        if (searchQuery) {
            return filtered;
        }

        if (showAll) {
            return [...featured, ...other];
        }

        return featured.slice(0, maxVisible);
    }, [featured, other, filtered, showAll, maxVisible, searchQuery]);

    const hasMoreLoaders = featured.length + other.length > maxVisible && !searchQuery;
    const showExpandButton = hasMoreLoaders && !showAll;
    const showCollapseButton = hasMoreLoaders && showAll;

    if (loaders.length === 0) {
        return <p className='text-gray-500 text-sm'>No loaders available</p>;
    }

    return (
        <div className='space-y-3'>
            {/* Search Input */}
            <div className='relative'>
                <Input
                    className='w-full py-2 pr-8 pl-3 text-sm'
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    placeholder='Search loaders...'
                    type='text'
                    value={searchQuery}
                />
                {searchQuery && (
                    <button
                        className='absolute top-1/2 right-2 -translate-y-1/2 transform text-gray-400 text-sm hover:text-gray-600'
                        onClick={() => setSearchQuery('')}
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Loaders List */}
            <div className='max-h-80 space-y-2 overflow-y-auto'>
                {loadersToShow.length === 0 ? (
                    <p className='py-2 text-center text-gray-500 text-sm'>
                        No loaders matching &quot;{searchQuery}&quot;
                    </p>
                ) : (
                    loadersToShow.map((loader) => (
                        <Checkbox
                            checked={selectedLoaders.includes(loader.id)}
                            key={loader.id}
                            label={capitalizeFirstLetter(loader.name)}
                            onChange={(isChecked) => {
                                const newSelected = isChecked
                                    ? [...selectedLoaders, loader.id]
                                    : selectedLoaders.filter((id) => id !== loader.id);
                                setSelectedLoaders(newSelected);
                            }}
                        />
                    ))
                )}
            </div>

            {/* Selection counter and clear search */}
            <div className='flex items-center justify-between border-gray-200 border-t pt-2'>
                <span className='text-gray-500 text-xs'>{selectedLoaders.length} selected</span>

                {searchQuery && (
                    <button
                        className='font-medium text-gray-600 text-xs hover:text-gray-800'
                        onClick={() => setSearchQuery('')}
                    >
                        Clear search
                    </button>
                )}
            </div>

            {/* Clean Modern Expand/Collapse Toggle */}
            {showExpandButton && (
                <div className='border-gray-200 border-t pt-2'>
                    <button
                        className='flex w-full items-center justify-center gap-1.5 rounded-md py-2 text-white text-xs transition-colors duration-150 hover:text-gray-300'
                        onClick={() => setShowAll(true)}
                    >
                        <span className='transform transition-transform duration-200'>▾</span>
                        Show {featured.length + other.length - maxVisible} more loaders
                    </button>
                </div>
            )}

            {showCollapseButton && (
                <div className='border-gray-200 border-t pt-2'>
                    <button
                        className='flex w-full items-center justify-center gap-1.5 rounded-md py-2 text-white text-xs transition-colors duration-150 hover:text-gray-300'
                        onClick={() => setShowAll(false)}
                    >
                        <span className='rotate-180 transform transition-transform duration-200'>▾</span>
                        Show less
                    </button>
                </div>
            )}

            {/* Clear search button */}
            {searchQuery && (
                <button
                    className='mt-2 w-full border-gray-200 border-t py-1 text-white text-xs hover:text-gray-300'
                    onClick={() => setSearchQuery('')}
                >
                    Clear search
                </button>
            )}
        </div>
    );
};

export default LoaderSelector;
