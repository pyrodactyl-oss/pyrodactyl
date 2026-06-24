import { useMemo, useState } from 'react';

import { Checkbox } from '@/components/elements/CheckboxLabel';
import Input from '@/components/elements/Input';

import { useGlobalStateContext } from './config';

export const VersionSelector = () => {
    const { gameVersions, selectedVersions, setSelectedVersions } = useGlobalStateContext();
    const [showSnapshots, setShowSnapshots] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter versions based on showSnapshots and search
    const filteredVersions = useMemo(() => {
        let versions = showSnapshots ? gameVersions : gameVersions.filter((v) => v.type !== 'snapshot');

        // Apply search filter if query exists
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            versions = versions.filter(
                (version) =>
                    version.name.toLowerCase().includes(query) ||
                    version.id.toLowerCase().includes(query) ||
                    version.type.toLowerCase().includes(query),
            );
        }

        return versions;
    }, [gameVersions, showSnapshots, searchQuery]);

    // Group versions by type for better organization
    const { releases, snapshots, betas } = useMemo(() => {
        const releases = filteredVersions.filter((v) => v.type === 'release');
        const snapshots = filteredVersions.filter((v) => v.type === 'snapshot');
        const betas = filteredVersions.filter((v) => v.type === 'beta');

        return { releases, snapshots, betas };
    }, [filteredVersions]);

    const hasSearchResults = filteredVersions.length > 0;
    const hasReleases = releases.length > 0;
    const hasSnapshots = snapshots.length > 0;
    const hasBetas = betas.length > 0;

    return (
        <div className='space-y-3'>
            {/* Search Input */}
            <div className='relative'>
                <Input
                    className='w-full py-1 pr-8 pl-3 text-sm'
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    placeholder='Search versions...'
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

            {gameVersions.length === 0 ? (
                <p className='text-gray-500 text-sm'>No versions available</p>
            ) : hasSearchResults ? (
                <>
                    <div className='scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-100 max-h-60 space-y-1 overflow-y-auto'>
                        {/* Show releases first */}
                        {hasReleases && (
                            <div className='space-y-1'>
                                {!searchQuery && <p className='font-medium text-gray-500 text-xs'>Releases</p>}
                                {releases.map((version) => (
                                    <Checkbox
                                        checked={selectedVersions.includes(version.id)}
                                        key={version.id}
                                        label={version.name}
                                        onChange={(isChecked) => {
                                            const newSelected = isChecked
                                                ? [...selectedVersions, version.id]
                                                : selectedVersions.filter((id) => id !== version.id);
                                            setSelectedVersions(newSelected);
                                        }}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Show snapshots if enabled or searching */}
                        {(showSnapshots || searchQuery) && hasSnapshots && (
                            <div className='space-y-1'>
                                {!searchQuery && <p className='pt-1 font-medium text-gray-500 text-xs'>Snapshots</p>}
                                {snapshots.map((version) => (
                                    <Checkbox
                                        checked={selectedVersions.includes(version.id)}
                                        key={version.id}
                                        label={version.name}
                                        onChange={(isChecked) => {
                                            const newSelected = isChecked
                                                ? [...selectedVersions, version.id]
                                                : selectedVersions.filter((id) => id !== version.id);
                                            setSelectedVersions(newSelected);
                                        }}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Show betas */}
                        {hasBetas && (
                            <div className='space-y-1'>
                                {!searchQuery && <p className='pt-1 font-medium text-gray-500 text-xs'>Betas</p>}
                                {betas.map((version) => (
                                    <Checkbox
                                        checked={selectedVersions.includes(version.id)}
                                        key={version.id}
                                        label={version.name}
                                        onChange={(isChecked) => {
                                            const newSelected = isChecked
                                                ? [...selectedVersions, version.id]
                                                : selectedVersions.filter((id) => id !== version.id);
                                            setSelectedVersions(newSelected);
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className='flex items-center justify-between border-gray-200 border-t pt-1'>
                        <span className='text-gray-500 text-xs'>{selectedVersions.length} selected</span>

                        {searchQuery && (
                            <button
                                className='font-medium text-gray-600 text-xs hover:text-gray-800'
                                onClick={() => setSearchQuery('')}
                            >
                                Clear search
                            </button>
                        )}
                    </div>

                    {!searchQuery && (
                        <div className='border-gray-200 border-t pt-1'>
                            <button
                                className='flex w-full items-center justify-center gap-1 py-1 font-medium text-white-600 text-xs hover:text-gray-300'
                                onClick={() => setShowSnapshots((prev) => !prev)}
                            >
                                <span>{showSnapshots ? '-' : '+'}</span>
                                {showSnapshots ? 'Hide Snapshots' : 'Show Snapshots'}
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <p className='py-2 text-center text-gray-500 text-sm'>
                    No versions found matching &quot;{searchQuery}&quot;
                </p>
            )}
        </div>
    );
};

export default VersionSelector;
