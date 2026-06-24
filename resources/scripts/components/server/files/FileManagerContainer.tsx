import { useVirtualizer } from '@tanstack/react-virtual';
import debounce from 'debounce';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { httpErrorToHuman } from '@/api/http';
import type { FileObject } from '@/api/server/files/loadDirectory';
import Can from '@/components/elements/Can';
import { Checkbox } from '@/components/elements/CheckboxNew';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import { ServerError } from '@/components/elements/ScreenBlock';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import FileManagerBreadcrumbs from '@/components/server/files/FileManagerBreadcrumbs';
import FileManagerStatus from '@/components/server/files/FileManagerStatus';
import FileObjectRow from '@/components/server/files/FileObjectRow';
import MassActionsBar from '@/components/server/files/MassActionsBar';
import NewDirectoryButton from '@/components/server/files/NewDirectoryButton';
import UploadButton from '@/components/server/files/UploadButton';
import ServerHeader from '@/components/server/header/ServerHeader';
import { hashToPath } from '@/helpers';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import { useStoreActions } from '@/state/hooks';
import { ServerContext } from '@/state/server';

import NewFileButton from './NewFileButton';

const sortFiles = (files: FileObject[]): FileObject[] => {
    const sortedFiles: FileObject[] = files
        .sort((a, b) => a.name.localeCompare(b.name))
        .sort((a, b) => (a.isFile === b.isFile ? 0 : a.isFile ? 1 : -1));
    return sortedFiles.filter((file, index) => index === 0 || file.name !== sortedFiles[index - 1]?.name);
};

const FileManagerContainer = () => {
    const parentRef = useRef<HTMLDivElement | null>(null);

    const id = ServerContext.useStoreState((state) => state.server.data!.id);

    const { hash, pathname } = useLocation();
    const { data: files, error, mutate } = useFileManagerSwr();

    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const clearFlashes = useStoreActions((actions) => actions.flashes.clearFlashes);
    const setDirectory = ServerContext.useStoreActions((actions) => actions.files.setDirectory);

    const setSelectedFiles = ServerContext.useStoreActions((actions) => actions.files.setSelectedFiles);
    const selectedFilesLength = ServerContext.useStoreState((state) => state.files.selectedFiles.length);

    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        clearFlashes('files');
        setSelectedFiles([]);
        setDirectory(hashToPath(hash));
    }, [hash]);

    useEffect(() => {
        mutate();
    }, [directory]);

    const onSelectAllClick = () => {
        console.log('files', files);
        setSelectedFiles(
            selectedFilesLength === (files?.length === 0 ? -1 : files?.length)
                ? []
                : files?.map((file) => file.name) || [],
        );
    };

    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = debounce(setSearchTerm, 50);

    const filesArray = sortFiles(files ?? []).filter((file) =>
        file.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    useEffect(() => {
        setSearchTerm('');

        // Clean imput using a reference
        if (searchInputRef.current) {
            searchInputRef.current.value = '';
        }
    }, [hash, pathname, directory]);
    const rowVirtualizer = useVirtualizer({
        // count: 10000,
        count: filesArray.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 54,
        // scrollMargin: 54,
    });

    if (error) {
        return <ServerError message={httpErrorToHuman(error)} title={'Something went wrong.'} />;
    }

    return (
        <ServerContentBlock className='p-0!' showFlashKey={'files'} title={'File Manager'}>
            <div className='h-fit px-2 pt-2 sm:px-14 sm:pt-14'>
                <ErrorBoundary>
                    <ServerHeader />
                    <Can action={'file.create'}>
                        <div className='flex flex-row gap-1 pb-4'>
                            <FileManagerStatus />
                            <div className='gap-0'>
                                <NewDirectoryButton />
                                <NewFileButton id={id} />
                            </div>
                            <UploadButton />
                        </div>
                    </Can>
                    <div className={'mb-4 flex flex-wrap-reverse md:flex-nowrap'}>
                        <FileManagerBreadcrumbs
                            renderLeft={
                                <Checkbox
                                    checked={selectedFilesLength === (files?.length === 0 ? -1 : files?.length)}
                                    className='mr-4 ml-[1.22rem]'
                                    onCheckedChange={() => onSelectAllClick()}
                                />
                            }
                        />
                    </div>
                </ErrorBoundary>
            </div>
            {files ? (
                <>
                    {files.length ? (
                        <>
                            <div className='relative mx-2 rounded-md border-[#ffffff12] border-[1px] p-1 sm:mr-12 sm:ml-12'>
                                <div className='pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 pl-2'>
                                    <svg
                                        className='h-5 w-5 opacity-40'
                                        fill='none'
                                        stroke='currentColor'
                                        strokeWidth={1.5}
                                        viewBox='0 0 24 24'
                                        xmlns='http://www.w3.org/2000/svg'
                                    >
                                        <path
                                            d='m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z'
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                        />
                                    </svg>
                                </div>

                                <input
                                    className='w-full rounded-lg bg-[#ffffff11] py-4 pl-14 font-bold text-sm outline-none'
                                    onChange={(event) => debouncedSearchTerm(event.target.value)}
                                    placeholder='Search...'
                                    ref={searchInputRef}
                                    type='text'
                                />
                            </div>
                            <div className='max-h-screen min-h-fit overflow-auto' ref={parentRef}>
                                <div
                                    className='mx-2 rounded-xl border-[#ffffff12] border-[1px] bg-[radial-gradient(124.75%_124.75%_at_50.01%_-10.55%,_rgb(16,16,16)_0%,rgb(4,4,4)_100%)] p-1 sm:mr-12 sm:ml-12'
                                    data-pyro-file-manager-files
                                    style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
                                >
                                    <div
                                        className='flex w-full flex-col gap-0.5 overflow-hidden rounded-lg'
                                        style={{
                                            height: `${rowVirtualizer.getTotalSize()}px`,
                                            width: '100%',
                                            position: 'relative',
                                        }}
                                    >
                                        {rowVirtualizer.getVirtualItems().map((item) => {
                                            if (filesArray[item.index] !== undefined) {
                                                return (
                                                    <div
                                                        className='absolute top-0 left-0 w-full'
                                                        key={item.key}
                                                        style={{
                                                            height: `${item.size}px`,
                                                            transform: `translateY(${item.start}px)`,
                                                        }}
                                                    >
                                                        <FileObjectRow
                                                            // @ts-expect-error - Legacy type suppression
                                                            file={filesArray[item.index]}
                                                            key={filesArray[item.index]?.name}
                                                        />
                                                    </div>
                                                );
                                            }
                                            return <></>;
                                        })}
                                    </div>
                                </div>
                            </div>
                            <MassActionsBar />
                        </>
                    ) : (
                        <p className={'text-center text-sm text-zinc-400'}>This folder is empty.</p>
                    )}
                </>
            ) : null}
        </ServerContentBlock>
    );
};

export default FileManagerContainer;
