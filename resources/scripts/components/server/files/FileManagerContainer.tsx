import { hashToPath } from '@/helpers';
import { ArrowUturnCcwLeft, TrashBin } from '@gravity-ui/icons';
import { useVirtualizer } from '@tanstack/react-virtual';
import debounce from 'debounce';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import ActionButton from '@/components/elements/ActionButton';
import Can from '@/components/elements/Can';
import { Checkbox } from '@/components/elements/CheckboxNew';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import { ServerError } from '@/components/elements/ScreenBlock';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { Dialog } from '@/components/elements/dialog';
import FadeTransition from '@/components/elements/transitions/FadeTransition';
import FileManagerBreadcrumbs from '@/components/server/files/FileManagerBreadcrumbs';
import FileManagerStatus from '@/components/server/files/FileManagerStatus';
import FileObjectRow from '@/components/server/files/FileObjectRow';
import MassActionsBar from '@/components/server/files/MassActionsBar';
import NewDirectoryButton from '@/components/server/files/NewDirectoryButton';
import TrashFileRow from '@/components/server/files/TrashFileRow';
import UploadButton from '@/components/server/files/UploadButton';

import i18n from '@/lib/i18n';

import { httpErrorToHuman } from '@/api/http';
import { bulkDelete, bulkRestore } from '@/api/server/files/bulkTrash';
import { FileObject } from '@/api/server/files/loadDirectory';
import loadTrash, { TrashedFile } from '@/api/server/files/loadTrash';

import { useStoreActions, useStoreState } from '@/state/hooks';
import { ServerContext } from '@/state/server';

import useFileManagerSwr from '@/plugins/useFileManagerSwr';

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
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { hash, pathname } = useLocation();
    const { data: files, error, mutate } = useFileManagerSwr();

    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const clearFlashes = useStoreActions((actions) => actions.flashes.clearFlashes);
    const setDirectory = ServerContext.useStoreActions((actions) => actions.files.setDirectory);

    const setSelectedFiles = ServerContext.useStoreActions((actions) => actions.files.setSelectedFiles);
    const selectedFilesLength = ServerContext.useStoreState((state) => state.files.selectedFiles.length);

    const searchInputRef = useRef<HTMLInputElement>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = debounce(setSearchTerm, 50);

    const [trashMode, setTrashMode] = useState(false);
    const [trashFiles, setTrashFiles] = useState<TrashedFile[]>([]);
    const [selectedTrash, setSelectedTrash] = useState<string[]>([]);
    const [showBulkRestore, setShowBulkRestore] = useState(false);
    const [showBulkDelete, setShowBulkDelete] = useState(false);
    const retentionDays = useStoreState((state) => state.settings.data?.trash_retention_days ?? 30);

    const fetchTrash = useCallback(() => {
        loadTrash(uuid)
            .then(setTrashFiles)
            .catch(() => {});
    }, [uuid]);

    const enterTrash = useCallback(() => {
        setSelectedFiles([]);
        setTrashMode(true);
        setSelectedTrash([]);
    }, []);

    const exitTrash = useCallback(() => {
        setTrashMode(false);
        setSelectedTrash([]);
        setSearchTerm('');
    }, []);

    const toggleTrashSelect = useCallback((fileUuid: string) => {
        setSelectedTrash((prev) =>
            prev.includes(fileUuid) ? prev.filter((u) => u !== fileUuid) : [...prev, fileUuid],
        );
    }, []);

    const navigateTrash = useCallback((_file: TrashedFile) => {
        // TODO: Implement subdirectory navigation in trash
    }, []);

    useEffect(() => {
        clearFlashes('files');
        setSelectedFiles([]);
        setDirectory(hashToPath(hash));
    }, [hash]);

    useEffect(() => {
        if (trashMode) {
            fetchTrash();
        } else {
            mutate();
        }
    }, [trashMode, directory, hash]);

    useEffect(() => {
        setSearchTerm('');
        if (searchInputRef.current) {
            searchInputRef.current.value = '';
        }
    }, [hash, pathname, directory, trashMode]);

    const onSelectAllClick = () => {
        const selectableFiles = (files ?? []).filter((f) => f.name !== '.trash');
        setSelectedFiles(
            selectedFilesLength === (selectableFiles.length === 0 ? -1 : selectableFiles.length)
                ? []
                : selectableFiles.map((file) => file.name) || [],
        );
    };

    const filteredTrash = trashFiles.filter((f) => f.original_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const filesArray = sortFiles(files ?? []).filter(
        (file) => file.name.toLowerCase().includes(searchTerm.toLowerCase()) && file.name !== '.trash',
    );

    const onSelectAllTrash = useCallback(() => {
        setSelectedTrash((prev) => (prev.length === filteredTrash.length ? [] : filteredTrash.map((f) => f.uuid)));
    }, [filteredTrash]);

    const handleBulkRestore = useCallback(() => {
        if (selectedTrash.length === 0) return;
        bulkRestore(uuid, selectedTrash)
            .then(() => {
                setSelectedTrash([]);
                fetchTrash();
            })
            .catch(() => {});
    }, [uuid, selectedTrash, fetchTrash]);

    const handleBulkDelete = useCallback(() => {
        if (selectedTrash.length === 0) return;
        bulkDelete(uuid, selectedTrash)
            .then(() => {
                setSelectedTrash([]);
                fetchTrash();
            })
            .catch(() => {});
    }, [uuid, selectedTrash, fetchTrash]);

    const rowVirtualizer = useVirtualizer({
        count: trashMode ? filteredTrash.length : filesArray.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 54,
    });

    if (error && !trashMode) {
        return <ServerError title={i18n.t('server:files.error')} message={httpErrorToHuman(error)} />;
    }

    return (
        <ServerContentBlock className='p-0!' title={i18n.t('server:files.title')} showFlashKey={'files'}>
            <div className='px-2 sm:px-14 pt-2 h-full sm:pt-14'>
                {!trashMode && (
                    <ErrorBoundary>
                        <MainPageHeader
                            direction='column'
                            title={i18n.t('server:files.header')}
                            titleChildren={
                                <Can action={'file.create'}>
                                    <div className='flex flex-row gap-1'>
                                        <FileManagerStatus />
                                        <Can action={'file.delete'}>
                                            <ActionButton
                                                variant='secondary'
                                                onClick={enterTrash}
                                                title={i18n.t('server:files.trash_button')}
                                            >
                                                <TrashBin className='h-4 w-4 text-red-400' />
                                            </ActionButton>
                                            <div className='w-2' />
                                        </Can>
                                        <NewDirectoryButton />
                                        <NewFileButton id={id} />
                                        <div className='w-2' />
                                        <UploadButton />
                                    </div>
                                </Can>
                            }
                        >
                            <p className='text-sm text-neutral-400 leading-relaxed'>
                                {i18n.t('server:files.description')}
                            </p>
                        </MainPageHeader>
                        <div className={'flex flex-wrap-reverse md:flex-nowrap mb-4'}>
                            <FileManagerBreadcrumbs
                                renderLeft={
                                    <Checkbox
                                        className='ml-[1.22rem] mr-4'
                                        checked={(() => {
                                            const selectable = (files ?? []).filter((f) => f.name !== '.trash');
                                            return (
                                                selectedFilesLength ===
                                                (selectable.length === 0 ? -1 : selectable.length)
                                            );
                                        })()}
                                        onCheckedChange={() => onSelectAllClick()}
                                    />
                                }
                            />
                        </div>
                    </ErrorBoundary>
                )}
                {trashMode && (
                    <ErrorBoundary>
                        <MainPageHeader
                            direction='column'
                            title={i18n.t('server:files.trash_header')}
                            titleChildren={
                                <div className='flex flex-row gap-1 items-center'>
                                    <ActionButton variant='secondary' onClick={exitTrash}>
                                        <ArrowUturnCcwLeft className='h-4 w-4 mr-1' />
                                        {i18n.t('server:files.back_to_files')}
                                    </ActionButton>
                                    {filteredTrash.length > 0 && (
                                        <Checkbox
                                            className='ml-2'
                                            checked={selectedTrash.length === filteredTrash.length}
                                            onCheckedChange={onSelectAllTrash}
                                        />
                                    )}
                                </div>
                            }
                        >
                            <p className='text-sm text-neutral-400 leading-relaxed'>
                                {i18n.t('server:files.trash_description', { days: retentionDays })}
                            </p>
                        </MainPageHeader>
                    </ErrorBoundary>
                )}
            </div>
            {(trashMode || files) && (
                <div className='relative p-1 border-[1px] border-[#ffffff12] rounded-md sm:ml-12 sm:mr-12 mx-2 mb-4'>
                    <div className='absolute left-4 top-1/2 pl-2 -translate-y-1/2 pointer-events-none'>
                        <svg
                            xmlns='http://www.w3.org/2000/svg'
                            fill='none'
                            viewBox='0 0 24 24'
                            strokeWidth={1.5}
                            stroke='currentColor'
                            className='w-5 h-5 opacity-40'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                d='m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z'
                            />
                        </svg>
                    </div>
                    <input
                        ref={searchInputRef}
                        className='pl-14 py-4 w-full rounded-lg bg-[#ffffff11] text-sm font-bold outline-none'
                        type='text'
                        placeholder={i18n.t('server:files.search_placeholder')}
                        onChange={(event) => debouncedSearchTerm(event.target.value)}
                    />
                </div>
            )}
            {!trashMode && !files ? (
                <div className='sm:ml-12 sm:mr-12 mx-2'>
                    <div className='px-1 py-0.5 border-[1px] border-[#ffffff12] rounded-xl bg-[radial-gradient(124.75%_124.75%_at_50.01%_-10.55%,_rgb(16,16,16)_0%,rgb(4,4,4)_100%)]'>
                        <div className='w-full overflow-hidden rounded-lg gap-0.5 flex flex-col'>
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div
                                    key={i}
                                    className='flex items-center border-[1px] border-[#ffffff07] bg-[#ffffff08] p-1 h-[54px] first:rounded-t-sm last:rounded-b-sm animate-pulse'
                                    style={{ animationDelay: `${i * 75}ms` }}
                                >
                                    <div className='w-6 flex-shrink-0 ml-4'>
                                        <div className='h-5 w-5 rounded bg-[#ffffff11]' />
                                    </div>
                                    <div className='flex flex-1 items-center truncate overflow-hidden px-4 py-2'>
                                        <div className='flex-none mr-4 pl-3'>
                                            <div className='h-[22px] w-[22px] rounded bg-[#ffffff11]' />
                                        </div>
                                        <div className='flex-1'>
                                            <div className='h-4 w-1/3 rounded bg-[#ffffff11]' />
                                        </div>
                                        <div className='w-1/6 text-right mr-4 hidden sm:block'>
                                            <div className='h-3 w-16 rounded bg-[#ffffff11] ml-auto' />
                                        </div>
                                        <div className='w-1/5 text-right mr-4 hidden md:block'>
                                            <div className='h-3 w-20 rounded bg-[#ffffff11] ml-auto' />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {((trashMode && filteredTrash.length === 0) || (!trashMode && filesArray.length === 0)) && (
                        <p className='text-sm text-zinc-400 text-center py-8'>
                            {trashMode ? i18n.t('server:files.empty_trash') : i18n.t('server:files.empty_folder')}
                        </p>
                    )}
                    {(trashMode ? filteredTrash.length > 0 : filesArray.length > 0) && (
                        <>
                            <div ref={parentRef} className='max-h-screen min-h-screen overflow-auto'>
                                <div
                                    data-pyro-file-manager-files
                                    className='px-1 py-0.5 border-[1px] border-[#ffffff12] rounded-xl sm:ml-12 sm:mr-12 mx-2 bg-[radial-gradient(124.75%_124.75%_at_50.01%_-10.55%,_rgb(16,16,16)_0%,rgb(4,4,4)_100%)]'
                                    style={{ height: `${rowVirtualizer.getTotalSize() + 4}px` }}
                                >
                                    <div
                                        className='w-full overflow-hidden rounded-lg gap-0.5 flex flex-col'
                                        style={{
                                            height: `${rowVirtualizer.getTotalSize()}px`,
                                            width: '100%',
                                            position: 'relative',
                                        }}
                                    >
                                        {rowVirtualizer.getVirtualItems().map((item) => {
                                            if (trashMode) {
                                                const trashFile = filteredTrash[item.index];
                                                if (!trashFile) return null;
                                                return (
                                                    <div
                                                        key={item.key}
                                                        className='w-full absolute left-0 top-0'
                                                        style={{
                                                            height: `${item.size}px`,
                                                            transform: `translateY(${item.start}px)`,
                                                        }}
                                                    >
                                                        <TrashFileRow
                                                            file={trashFile}
                                                            selected={selectedTrash.includes(trashFile.uuid)}
                                                            onSelect={toggleTrashSelect}
                                                            onEnter={() => navigateTrash(trashFile)}
                                                            onRestored={fetchTrash}
                                                            onDeleted={fetchTrash}
                                                            retentionDays={retentionDays}
                                                        />
                                                    </div>
                                                );
                                            }
                                            const fileObj = filesArray[item.index];
                                            if (!fileObj) return null;
                                            return (
                                                <div
                                                    key={item.key}
                                                    className='w-full absolute left-0 top-0'
                                                    style={{
                                                        height: `${item.size}px`,
                                                        transform: `translateY(${item.start}px)`,
                                                    }}
                                                >
                                                    <FileObjectRow
                                                        // @ts-expect-error - Legacy type suppression
                                                        file={fileObj}
                                                        key={fileObj.name}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                            {!trashMode && <MassActionsBar />}
                            {trashMode && (
                                <FadeTransition duration='duration-75' show={selectedTrash.length > 0} appear unmount>
                                    <div className='pointer-events-none fixed bottom-0 left-0 right-0 mb-6 flex justify-center w-full z-50'>
                                        <div className='flex items-center space-x-4 pointer-events-auto rounded-lg p-4 bg-black/50 backdrop-blur-sm border border-[#ffffff12]'>
                                            <ActionButton onClick={() => setShowBulkRestore(true)}>
                                                {i18n.t('server:files.restore_selected', {
                                                    count: selectedTrash.length,
                                                })}
                                            </ActionButton>
                                            <ActionButton variant='danger' onClick={() => setShowBulkDelete(true)}>
                                                {i18n.t('server:files.delete_selected', {
                                                    count: selectedTrash.length,
                                                })}
                                            </ActionButton>
                                        </div>
                                    </div>
                                </FadeTransition>
                            )}
                        </>
                    )}
                </>
            )}
            <Dialog.Confirm
                open={showBulkRestore}
                onClose={() => setShowBulkRestore(false)}
                title={i18n.t('server:files.restore_title')}
                confirm={i18n.t('server:files.restore_confirm')}
                onConfirmed={() => {
                    setShowBulkRestore(false);
                    handleBulkRestore();
                }}
            >
                {i18n.t('server:files.restore_message', { count: selectedTrash.length })}
            </Dialog.Confirm>
            <Dialog.Confirm
                open={showBulkDelete}
                onClose={() => setShowBulkDelete(false)}
                title={i18n.t('server:files.delete_title')}
                confirm={i18n.t('server:files.delete_confirm')}
                onConfirmed={() => {
                    setShowBulkDelete(false);
                    handleBulkDelete();
                }}
            >
                {i18n.t('server:files.delete_message', { count: selectedTrash.length })}
            </Dialog.Confirm>
        </ServerContentBlock>
    );
};

export default FileManagerContainer;
