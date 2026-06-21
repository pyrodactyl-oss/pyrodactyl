import { FileArrowUp, FolderArrowUp } from '@gravity-ui/icons';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';

import ActionButton from '@/components/elements/ActionButton';
import { ModalMask } from '@/components/elements/Modal';
import { Dialog } from '@/components/elements/dialog';
import ConfirmationDialog from '@/components/elements/dialog/ConfirmationDialog';
import FadeTransition from '@/components/elements/transitions/FadeTransition';

import i18n from '@/lib/i18n';

import createDirectory from '@/api/server/files/createDirectory';
import getFileUploadUrl from '@/api/server/files/getFileUploadUrl';

import { ServerContext } from '@/state/server';

import useEventListener from '@/plugins/useEventListener';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import { useFlashKey } from '@/plugins/useFlash';

function isFileOrDirectory(event: DragEvent): boolean {
    if (!event.dataTransfer?.types) {
        return false;
    }

    return event.dataTransfer.types.some((value) => value.toLowerCase() === 'files');
}

async function collectFilesFromEntry(
    entry: FileSystemEntry,
    basePath: string,
): Promise<Array<{ file: File; path: string }>> {
    const results: Array<{ file: File; path: string }> = [];

    if (entry.isFile) {
        const file = await new Promise<File>((resolve, reject) => {
            (entry as FileSystemFileEntry).file(resolve, reject);
        });
        results.push({ file, path: basePath });
    } else if (entry.isDirectory) {
        const dirEntry = entry as FileSystemDirectoryEntry;
        const dirPath = basePath ? `${basePath}/${entry.name}` : entry.name;
        const reader = dirEntry.createReader();

        const readAllEntries = (): Promise<FileSystemEntry[]> => {
            return new Promise((resolve) => {
                const allEntries: FileSystemEntry[] = [];
                const readBatch = () => {
                    reader.readEntries((entries) => {
                        if (entries.length === 0) {
                            resolve(allEntries);
                        } else {
                            allEntries.push(...entries);
                            readBatch();
                        }
                    });
                };
                readBatch();
            });
        };

        const entries = await readAllEntries();
        for (const child of entries) {
            const childResults = await collectFilesFromEntry(child, dirPath);
            results.push(...childResults);
        }
    }

    return results;
}

const UploadButton = () => {
    const fileUploadInput = useRef<HTMLInputElement>(null);
    const folderUploadInput = useRef<HTMLInputElement>(null);
    const [visible, setVisible] = useState(false);
    const [pendingFolder, setPendingFolder] = useState<{
        files: Array<{ file: File; relDir: string }>;
        dirsNeeded: string[];
    } | null>(null);
    const [pendingConflicts, setPendingConflicts] = useState<{
        files: Array<{ file: File; relDir: string }>;
        existing: string[];
    } | null>(null);
    const { data: currentFiles, mutate } = useFileManagerSwr();
    const { addError, clearAndAddHttpError } = useFlashKey('files');

    const name = ServerContext.useStoreState((state) => state.server.data!.name);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const { clearFileUploads, pushFileUpload } = ServerContext.useStoreActions((actions) => actions.files);

    useEventListener(
        'dragenter',
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isFileOrDirectory(e)) {
                return setVisible(true);
            }
        },
        { capture: true },
    );

    useEventListener('dragexit', () => setVisible(false), { capture: true });

    useEventListener('keydown', () => {
        if (visible) setVisible(false);
    });

    const ensureDirectories = async (paths: string[]) => {
        const uniqueDirs = [...new Set(paths)];
        for (const dir of uniqueDirs) {
            try {
                await createDirectory(uuid, directory, dir);
            } catch {
                // Directory may already exist, continue
            }
        }
    };

    const uploadFile = (file: File, targetDir: string) => {
        const controller = new AbortController();
        const uploadKey = targetDir ? `${targetDir}/${file.name}` : file.name;
        pushFileUpload({
            name: uploadKey,
            data: { abort: controller, loaded: 0, total: file.size },
        });

        return getFileUploadUrl(uuid)
            .then((url) =>
                axios
                    .post(
                        url,
                        { files: file },
                        {
                            signal: controller.signal,
                            headers: { 'Content-Type': 'multipart/form-data' },
                            params: { directory: targetDir || directory },
                        },
                    )
                    .then(() =>
                        pushFileUpload({
                            name: uploadKey,
                            data: { abort: controller, loaded: file.size, total: file.size },
                        }),
                    ),
            )
            .catch((error) => {
                const message = axios.isAxiosError(error)
                    ? error.response?.data?.error || error.message
                    : 'Upload failed';
                pushFileUpload({
                    name: uploadKey,
                    data: { abort: new AbortController(), loaded: file.size, total: file.size, error: message } as any,
                });
            });
    };

    const onFileSubmission = async (files: FileList) => {
        const maxFiles = 500;
        const validFiles = Array.from(files).filter((file) => file.size > 0 && (file.type || file.size !== 4096));

        if (validFiles.length > maxFiles) {
            return addError(
                i18n.t('server:files.too_many_files_message', { max: maxFiles, count: validFiles.length }),
                i18n.t('server:files.too_many_files_title'),
            );
        }

        clearAndAddHttpError();

        // Check for folders via webkitRelativePath (from input webkitdirectory)
        const hasFolders = Array.from(files).some((f) => f.webkitRelativePath);

        // Check via DataTransferItem for drag events
        if (!hasFolders) {
            const regularFiles = Array.from(files).filter((file) => file.size > 0 && (file.type || file.size !== 4096));
            const existing = currentFiles?.map((f) => f.name) ?? [];

            const uploads = regularFiles.map((file) => {
                const conflict = existing.includes(file.name);
                const name = conflict ? `${file.name} (replace)` : file.name;
                return () => uploadFile(file, directory);
            });
            const conflicts = regularFiles.filter((f) => existing.includes(f.name));

            if (conflicts.length > 0) {
                setPendingConflicts({
                    files: conflicts.map((f) => ({ file: f, relDir: '' })),
                    existing: conflicts.map((f) => f.name),
                });
                return;
            }

            Promise.all(uploads.map((fn) => fn()))
                .then(() => mutate())
                .catch((error) => {
                    clearAndAddHttpError(error);
                });
            return;
        }

        // Folder upload: group files by their relative directory
        const filePaths: Array<{ file: File; relDir: string }> = [];
        const dirsNeeded = new Set<string>();

        for (const file of Array.from(files)) {
            if (!file.size || (!file.type && file.size === 4096)) continue;
            const relPath = file.webkitRelativePath;
            const parts = relPath ? relPath.split('/') : [file.name];
            parts.pop();
            const relDir = parts.join('/');

            if (relDir) dirsNeeded.add(relDir);
            filePaths.push({ file, relDir });
        }

        if (filePaths.length > 50) {
            setPendingFolder({ files: filePaths, dirsNeeded: [...dirsNeeded] });
            return;
        }

        try {
            await ensureDirectories([...dirsNeeded]);
        } catch {
            return addError(i18n.t('server:files.upload_failed'), i18n.t('strings:error'));
        }

        const uploads = filePaths.map(
            ({ file, relDir }) =>
                () =>
                    uploadFile(file, directory + (relDir ? '/' + relDir : '')),
        );

        Promise.all(uploads.map((fn) => fn()))
            .then(() => mutate())
            .catch((error) => {
                clearAndAddHttpError(error);
            });
    };

    const confirmReplaceAll = async () => {
        if (!pendingConflicts) return;
        const { files } = pendingConflicts;
        setPendingConflicts(null);

        const uploads = files.map(
            ({ file, relDir }) =>
                () =>
                    uploadFile(file, directory + (relDir ? '/' + relDir : '')),
        );

        Promise.all(uploads.map((fn) => fn()))
            .then(() => mutate())
            .catch((error) => {
                clearAndAddHttpError(error);
            });
    };

    const getNextRenameIndex = (fileName: string): number => {
        const nameParts = fileName.split('.');
        const ext = nameParts.length > 1 ? '.' + nameParts.pop()! : '';
        const base = nameParts.join('.');
        const existing = currentFiles?.map((f) => f.name) ?? [];

        let maxIndex = 0;
        const pattern = new RegExp(
            `^${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\((\\d+)\\)${ext.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
        );
        for (const name of existing) {
            const match = name.match(pattern);
            if (match) {
                maxIndex = Math.max(maxIndex, parseInt(match[1], 10));
            }
        }
        // Also check if the base name (without number) exists
        if (maxIndex === 0 && existing.includes(fileName)) {
            maxIndex = 0;
        }
        return maxIndex + 1;
    };

    const confirmRenameAll = async () => {
        if (!pendingConflicts) return;
        const { files } = pendingConflicts;
        setPendingConflicts(null);

        const uploads = files.map(({ file, relDir }) => {
            const nameParts = file.name.split('.');
            const ext = nameParts.length > 1 ? '.' + nameParts.pop()! : '';
            const base = nameParts.join('.');
            const nextIndex = getNextRenameIndex(file.name);
            const renamed = new File([file], `${base} (${nextIndex})${ext}`, { type: file.type });
            return () => uploadFile(renamed, directory + (relDir ? '/' + relDir : ''));
        });

        Promise.all(uploads.map((fn) => fn()))
            .then(() => mutate())
            .catch((error) => {
                clearAndAddHttpError(error);
            });
    };

    const confirmFolderUpload = async () => {
        if (!pendingFolder) return;
        const { files, dirsNeeded } = pendingFolder;
        setPendingFolder(null);

        try {
            await ensureDirectories(dirsNeeded);
        } catch {
            return addError(i18n.t('server:files.upload_failed'), i18n.t('strings:error'));
        }

        const uploads = files.map(
            ({ file, relDir }) =>
                () =>
                    uploadFile(file, directory + (relDir ? '/' + relDir : '')),
        );

        Promise.all(uploads.map((fn) => fn()))
            .then(() => mutate())
            .catch((error) => {
                clearAndAddHttpError(error);
            });
    };

    const onDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setVisible(false);

        const items = e.dataTransfer?.items;
        if (!items || items.length === 0) return;

        // Collect all files from the drop using webkitGetAsEntry for folder support
        const collected: Array<{ file: File; path: string }> = [];
        const promises: Promise<void>[] = [];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.kind !== 'file') continue;
            const entry = item.webkitGetAsEntry?.();
            if (entry) {
                promises.push(
                    collectFilesFromEntry(entry, '').then((results) => {
                        collected.push(...results);
                    }),
                );
            } else {
                const file = item.getAsFile();
                if (file) collected.push({ file, path: '' });
            }
        }

        await Promise.all(promises);

        if (collected.length === 0) return;
        clearAndAddHttpError();

        const dirsNeeded = new Set<string>();
        const uploadItems: Array<{ file: File; relDir: string }> = [];

        for (const { file, path } of collected) {
            if (file.size === 0 || (!file.type && file.size === 4096)) continue;
            if (path) dirsNeeded.add(path);
            uploadItems.push({ file, relDir: path });
        }

        const existing = currentFiles?.map((f) => f.name) ?? [];
        const conflicts = uploadItems.filter(({ file, relDir }) => !relDir && existing.includes(file.name));
        if (conflicts.length > 0) {
            setPendingConflicts({ files: conflicts, existing: conflicts.map((f) => f.file.name) });
            return;
        }

        try {
            await ensureDirectories([...dirsNeeded]);
        } catch {
            return addError(i18n.t('server:files.upload_failed'), i18n.t('strings:error'));
        }

        const uploads = uploadItems.map(
            ({ file, relDir }) =>
                () =>
                    uploadFile(file, directory + (relDir ? '/' + relDir : '')),
        );

        Promise.all(uploads.map((fn) => fn()))
            .then(() => mutate())
            .catch((error) => {
                clearAndAddHttpError(error);
            });
    };

    return (
        <>
            <FadeTransition show={visible} duration='duration-75' key='upload_modal_mask' appear unmount>
                <ModalMask
                    className='flex'
                    onClick={() => setVisible(false)}
                    onDragOver={(e) => e.preventDefault()}
                    onDragLeave={() => {
                        setVisible(false);
                    }}
                    onDrop={onDrop}
                >
                    <div className={'w-full flex items-center justify-center pointer-events-none'}>
                        <div
                            className={
                                'relative flex flex-col items-center gap-4 bg-brand w-full rounded-2xl py-12 px-4 mx-10 max-w-sm'
                            }
                        >
                            <div className='absolute inset-4 border-dashed border-[#ffffff88] border-2 rounded-xl'></div>
                            <svg
                                width='24'
                                height='24'
                                viewBox='0 0 24 24'
                                fill='none'
                                xmlns='http://www.w3.org/2000/svg'
                                className='w-8 h-8'
                            >
                                <path
                                    d='M16.2812 1.25C17.5268 1.24996 18.5627 1.24993 19.3845 1.36163C20.2516 1.47949 21.0278 1.73812 21.6498 2.36687C22.2702 2.9941 22.524 3.77443 22.6399 4.64582C22.7501 5.47443 22.75 6.51982 22.75 7.78076V10.7193C22.75 11.9802 22.7501 13.0256 22.6399 13.8542C22.524 14.7256 22.2702 15.5059 21.6498 16.1331C21.0278 16.7619 20.2516 17.0205 19.3845 17.1384C18.5627 17.2501 17.5268 17.25 16.2812 17.25L15.2876 17.25C14.7353 17.25 14.2876 16.8023 14.2876 16.25C14.2876 15.6977 14.7353 15.25 15.2876 15.25H16.2108C17.545 15.25 18.4439 15.2478 19.1151 15.1566C19.7564 15.0694 20.0386 14.918 20.2278 14.7267C20.4186 14.5338 20.5704 14.2441 20.6573 13.5905C20.7479 12.9093 20.75 11.9979 20.75 10.65V7.85C20.75 6.5021 20.7479 5.59069 20.6573 4.90947C20.5704 4.2559 20.4186 3.96621 20.2278 3.77334C20.0386 3.58198 19.7564 3.43057 19.1151 3.34341C18.4439 3.25217 17.545 3.25 16.2108 3.25H15.2876C13.9534 3.25 13.0545 3.25217 12.3833 3.34341C12.2051 3.36763 12.1496 3.58343 12.285 3.70185L14.9085 5.99743C15.263 6.30758 15.3458 6.81271 15.1369 7.21248C15.0964 7.2899 15.0762 7.32861 15.0131 7.3711C14.9501 7.41358 14.8886 7.41953 14.7656 7.43142L9.74449 7.91666C9.19222 7.91361 8.74697 7.46344 8.75002 6.91116C8.75496 6.01395 8.77445 5.23439 8.86797 4.57713C8.96274 3.91111 9.14328 3.29001 9.52575 2.75108C9.62278 2.61437 9.73032 2.48648 9.84864 2.36687C10.4706 1.73812 11.2468 1.47949 12.1139 1.36163C12.9357 1.24993 13.9716 1.24996 15.2172 1.25H16.2812Z'
                                    fill='white'
                                />
                                <path
                                    fillRule='evenodd'
                                    clipRule='evenodd'
                                    d='M9.59334 5.25H9.59333H9.59332H8.40669H8.40667H8.40666C6.93025 5.24998 5.74683 5.24997 4.81751 5.37372C3.85586 5.50178 3.05447 5.77447 2.41849 6.4044C1.78151 7.03531 1.50485 7.83196 1.3751 8.78785C1.24997 9.70973 1.24998 10.8831 1.25 12.3443V12.3443V12.3443V15.6557V15.6557V15.6557C1.24998 17.1169 1.24997 18.2903 1.3751 19.2122C1.50485 20.168 1.78151 20.9647 2.41849 21.5956C3.05447 22.2255 3.85586 22.4982 4.81751 22.6263C5.74682 22.75 6.93025 22.75 8.40666 22.75H9.59335C11.0698 22.75 12.2532 22.75 13.1825 22.6263C14.1441 22.4982 14.9455 22.2255 15.5815 21.5956C16.2185 20.9647 16.4952 20.168 16.6249 19.2122C16.75 18.2903 16.75 17.1169 16.75 15.6557V12.3443C16.75 10.8831 16.75 9.70973 16.6249 8.78785C16.4952 7.83196 16.2185 7.03531 15.5815 6.4044C14.9455 5.77447 14.1441 5.50178 13.1825 5.37372C12.2532 5.24997 11.0698 5.24998 9.59334 5.25ZM6 11C5.44772 11 5 11.4477 5 12C5 12.5523 5.44772 13 6 13H9C9.55229 13 10 12.5523 10 12C10 11.4477 9.55229 11 9 11H6ZM6 16C5.44772 16 5 16.4477 5 17C5 17.5523 5.44772 18 6 18H11C11.5523 18 12 17.5523 12 17C12 16.4477 11.5523 16 11 16H6Z'
                                    fill='white'
                                />
                            </svg>
                            <h1
                                className={
                                    'flex-1 text-lg font-bold tracking-tight text-center truncate w-full relative px-4'
                                }
                            >
                                {i18n.t('server:files.upload_to', { name })}
                            </h1>
                        </div>
                    </div>
                </ModalMask>
            </FadeTransition>
            <input
                type={'file'}
                ref={fileUploadInput}
                className={`hidden`}
                onChange={(e) => {
                    if (!e.currentTarget.files) return;
                    onFileSubmission(e.currentTarget.files);
                    if (fileUploadInput.current) {
                        fileUploadInput.current.files = null;
                    }
                }}
                multiple
            />
            <input
                type={'file'}
                ref={folderUploadInput}
                className={`hidden`}
                onChange={(e) => {
                    if (!e.currentTarget.files) return;
                    onFileSubmission(e.currentTarget.files);
                    if (folderUploadInput.current) {
                        folderUploadInput.current.value = '';
                    }
                }}
                webkitdirectory=''
                multiple
            />
            <div className='flex flex-row gap-1'>
                <ActionButton
                    variant='secondary'
                    onClick={() => folderUploadInput.current && folderUploadInput.current.click()}
                    title={i18n.t('server:files.upload_folder')}
                >
                    <FolderArrowUp className='h-4 w-4' />
                </ActionButton>
                <ActionButton
                    variant='secondary'
                    onClick={() => fileUploadInput.current && fileUploadInput.current.click()}
                    title={i18n.t('server:files.upload_file')}
                >
                    <FileArrowUp className='h-4 w-4' />
                </ActionButton>
            </div>
            <ConfirmationDialog
                open={pendingFolder !== null}
                onClose={() => setPendingFolder(null)}
                onConfirmed={confirmFolderUpload}
                title={i18n.t('server:files.large_folder_upload')}
                confirm={i18n.t('server:files.large_folder_upload_confirm', {
                    count: pendingFolder?.files.length ?? 0,
                })}
            >
                <p>
                    {i18n.t('server:files.large_folder_upload_body', { count: pendingFolder?.files.length ?? 0 })}
                    {pendingFolder?.files[0]?.webkitRelativePath && (
                        <>
                            {' '}
                            {i18n.t('server:files.large_folder_upload_from', {
                                source: pendingFolder.files[0].webkitRelativePath.split('/')[0],
                            })}
                        </>
                    )}
                    .
                    {pendingFolder && pendingFolder.dirsNeeded.length > 0 && (
                        <>
                            {' '}
                            {i18n.t('server:files.large_folder_upload_subfolders', {
                                count: pendingFolder.dirsNeeded.length,
                            })}
                        </>
                    )}
                </p>
                <p className='mt-2 text-sm text-zinc-400'>{i18n.t('server:files.large_folder_upload_hint')}</p>
            </ConfirmationDialog>
            <Dialog
                open={pendingConflicts !== null}
                onClose={() => setPendingConflicts(null)}
                title={i18n.t('server:files.file_already_exists')}
            >
                <p>{i18n.t('server:files.file_exists_body', { count: pendingConflicts?.existing.length ?? 0 })}</p>
                <ul className='mt-2 text-sm text-zinc-400 list-disc pl-4 max-h-32 overflow-y-auto'>
                    {pendingConflicts?.existing.map((name) => (
                        <li key={name}>{name}</li>
                    ))}
                </ul>
                <Dialog.Footer>
                    <ActionButton variant='secondary' onClick={() => setPendingConflicts(null)}>
                        {i18n.t('strings:cancel')}
                    </ActionButton>
                    <ActionButton variant='primary' onClick={confirmRenameAll}>
                        {i18n.t('server:files.rename')}
                    </ActionButton>
                    <ActionButton variant='danger' onClick={confirmReplaceAll}>
                        {i18n.t('server:files.replace')}
                    </ActionButton>
                </Dialog.Footer>
            </Dialog>
        </>
    );
};

export default UploadButton;
