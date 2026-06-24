import { ChevronDownIcon } from '@radix-ui/react-icons';
import { useEffect, useRef, useState } from 'react';

import Button from '../../elements/ButtonV2';

interface ApiFile {
    file_type: string | null;
    filename: string;
    hashes: {
        sha512: string;
        sha1: string;
    };
    primary: boolean;
    size: number;
    url: string;
}

interface Version {
    author_id: string;
    changelog: string;
    changelog_url: string | null;
    date_published: string;
    downloads: number;
    featured: boolean;
    files: ApiFile[];
    game_versions: string[];
    id: string;
    loaders: string[];
    name: string;
    project_id: string;
    requested_status: string | null;
    status: string;
    version_number: string;
    version_type: string;
}

interface DropdownButtonProps {
    className?: string;
    onVersionSelect?: (version: Version) => void;
    versions: Version[];
}

const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
};

const DropdownButton = ({ versions, onVersionSelect, className = '' }: DropdownButtonProps) => {
    const [selectedVersion, setSelectedVersion] = useState<Version | null>(versions[0] || null);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = async (version: Version) => {
        setIsLoading(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate async operation
            setSelectedVersion(version);
            setIsOpen(false);
            onVersionSelect?.(version);
        } finally {
            setIsLoading(false);
        }
    };

    // Fallback UI if no versions are provided
    if (!versions.length) {
        return (
            <div className={`relative flex justify-center ${className}`}>
                <div className='relative w-full max-w-md'>
                    <Button
                        className='flex w-full items-center justify-between border-gray-700 bg-gray-900 px-4 py-3 text-left transition-colors hover:bg-gray-800 disabled:opacity-50'
                        disabled
                        variant='outline'
                    >
                        <span className='truncate font-medium'>No versions available</span>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative flex justify-center ${className}`} ref={dropdownRef}>
            <div className='relative w-full max-w-md'>
                <Button
                    aria-expanded={isOpen}
                    aria-haspopup='listbox'
                    className='flex w-full items-center justify-between border-gray-700 bg-gray-900 px-4 py-3 text-left transition-colors hover:bg-gray-800 disabled:opacity-50'
                    disabled={isLoading || !selectedVersion}
                    onClick={() => setIsOpen(!isOpen)}
                    ref={buttonRef}
                    variant='outline'
                >
                    <div className='flex flex-col'>
                        <span className='truncate font-medium'>
                            Version: {selectedVersion?.version_number || 'Select a version'}
                        </span>
                        {selectedVersion?.files?.[0]?.size && (
                            <span className='text-gray-400 text-xs'>
                                ({formatFileSize(selectedVersion.files[0].size)})
                            </span>
                        )}
                    </div>
                    <ChevronDownIcon
                        className={`ml-2 h-5 w-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                </Button>

                {isOpen && (
                    <div
                        className='absolute z-20 mt-2 max-h-96 w-full overflow-y-auto rounded-lg border border-gray-700 bg-gray-800 shadow-xl'
                        role='listbox'
                    >
                        {versions.map((version) => (
                            <div
                                aria-selected={version.id === selectedVersion?.id}
                                className={`cursor-pointer px-4 py-3 transition-colors ${
                                    version.id === selectedVersion?.id ? 'bg-brand text-white' : 'hover:bg-gray-700'
                                } focus:bg-gray-700 focus:outline-none`}
                                key={version.id}
                                onClick={() => handleSelect(version)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleSelect(version);
                                    }
                                }}
                                role='option'
                                tabIndex={0}
                            >
                                <div className='flex flex-col'>
                                    <div className='flex items-center justify-between'>
                                        <span className='font-medium'>{version.version_number}</span>
                                        <span className='text-gray-400 text-xs'>
                                            {new Date(version.date_published).toLocaleDateString()}
                                        </span>
                                    </div>
                                    {version.name && (
                                        <span className='truncate text-gray-300 text-sm'>{version.name}</span>
                                    )}
                                    <div className='mt-1 flex gap-2 text-gray-400 text-xs'>
                                        {version.files?.[0]?.file_type && (
                                            <span>Type: {version.files[0].file_type}</span>
                                        )}
                                        {version.files?.[0]?.size && (
                                            <span>Size: {formatFileSize(version.files[0].size)}</span>
                                        )}
                                        {version.game_versions?.length > 0 && (
                                            <span>Game: {version.game_versions[0]}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {isLoading && (
                <div className='absolute inset-0 flex items-center justify-center rounded-lg bg-gray-900/50'>
                    <div className='h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent' />
                </div>
            )}
        </div>
    );
};

export default DropdownButton;
