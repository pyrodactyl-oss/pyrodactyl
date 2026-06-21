import { BarsPlay, Copy, FileArrowDown, FileZipper, PencilToLine, Shield, TrashBin } from '@gravity-ui/icons';
import { join } from 'pathe';
import { memo, useState } from 'react';
import isEqual from 'react-fast-compare';
import { toast } from 'sonner';

import Can from '@/components/elements/Can';
import { ContextMenuContent, ContextMenuItem } from '@/components/elements/ContextMenu';
import { Dialog } from '@/components/elements/dialog';
import ChmodFileModal from '@/components/server/files/ChmodFileModal';
import RenameFileModal from '@/components/server/files/RenameFileModal';

import i18n from '@/lib/i18n';

import compressFiles from '@/api/server/files/compressFiles';
import copyFile from '@/api/server/files/copyFile';
import decompressFiles from '@/api/server/files/decompressFiles';
import getFileDownloadUrl from '@/api/server/files/getFileDownloadUrl';
import { FileObject } from '@/api/server/files/loadDirectory';
import trashFiles from '@/api/server/files/trashFiles';

import { useStoreState } from '@/state/hooks';
import { ServerContext } from '@/state/server';

import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import useFlash from '@/plugins/useFlash';

type ModalType = 'rename' | 'move' | 'chmod';

const FileDropdownMenu = ({ file }: { file: FileObject }) => {
    const [modal, setModal] = useState<ModalType | null>(null);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { mutate } = useFileManagerSwr();
    const { clearAndAddHttpError, clearFlashes } = useFlash();
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const retentionDays = useStoreState((state) => state.settings.data?.trash_retention_days ?? 30);

    const doDeletion = async () => {
        clearFlashes('files');

        await mutate((files) => files!.filter((f) => f.key !== file.key), false);

        trashFiles(uuid, directory, [file.isFile ? file.name : file.name + '/']).catch((error) => {
            mutate();
            clearAndAddHttpError({ key: 'files', error });
        });

        setShowConfirmation(false);
    };

    const doCopy = () => {
        clearFlashes('files');
        toast.info(i18n.t('server:files.duplicating'));

        copyFile(uuid, join(directory, file.name))
            .then(() => mutate())
            .then(() => toast.success(i18n.t('server:files.duplicated')))
            .catch((error) => clearAndAddHttpError({ key: 'files', error }));
    };

    const doDownload = () => {
        clearFlashes('files');

        getFileDownloadUrl(uuid, join(directory, file.name))
            .then((url) => {
                // @ts-expect-error this is valid
                window.location = url;
            })
            .catch((error) => clearAndAddHttpError({ key: 'files', error }));
    };

    const doArchive = () => {
        clearFlashes('files');
        toast.info(i18n.t('server:files.archiving'));

        compressFiles(uuid, directory, [file.name])
            .then(() => mutate())
            .then(() => toast.success(i18n.t('server:files.archived')))
            .catch((error) => clearAndAddHttpError({ key: 'files', error }));
    };

    const doUnarchive = () => {
        clearFlashes('files');
        toast.info(i18n.t('server:files.unarchiving'));

        decompressFiles(uuid, directory, file.name)
            .then(() => mutate())
            .then(() => toast.success(i18n.t('server:files.unarchived')))
            .catch((error) => clearAndAddHttpError({ key: 'files', error }));
    };

    return (
        <>
            <Dialog.Confirm
                open={showConfirmation}
                onClose={() => setShowConfirmation(false)}
                title={i18n.t('server:files.delete_item', {
                    type: file.isFile ? i18n.t('server:files.file_type') : i18n.t('server:files.directory_type'),
                })}
                confirm={i18n.t('server:files.delete_confirm')}
                onConfirmed={doDeletion}
            >
                {i18n.t('server:files.delete_body', {
                    type: file.isFile ? i18n.t('server:files.file_type') : i18n.t('server:files.directory_type'),
                    days: retentionDays,
                })}
            </Dialog.Confirm>
            {modal ? (
                modal === 'chmod' ? (
                    <ChmodFileModal
                        visible
                        appear
                        files={[{ file: file.name, mode: file.modeBits }]}
                        onDismissed={() => setModal(null)}
                    />
                ) : (
                    <RenameFileModal
                        visible
                        appear
                        files={[file.name]}
                        useMoveTerminology={modal === 'move'}
                        onDismissed={() => setModal(null)}
                    />
                )
            ) : null}
            <ContextMenuContent className='flex flex-col gap-1'>
                <Can action={'file.update'}>
                    <ContextMenuItem className='flex gap-2' onSelect={() => setModal('rename')}>
                        <PencilToLine className='h-4! w-4!' fill='currentColor' />
                        <span>{i18n.t('server:files.rename')}</span>
                    </ContextMenuItem>
                    <ContextMenuItem className='flex gap-2' onSelect={() => setModal('move')}>
                        <BarsPlay className='h-4! w-4!' fill='currentColor' />
                        <span>{i18n.t('server:files.move')}</span>
                    </ContextMenuItem>
                    <ContextMenuItem className='flex gap-2' onSelect={() => setModal('chmod')}>
                        <Shield className='h-4! w-4!' fill='currentColor' />
                        <span>{i18n.t('server:files.configure_permissions')}</span>
                    </ContextMenuItem>
                </Can>
                {file.isFile && (
                    <Can action={'file.create'}>
                        <ContextMenuItem className='flex gap-2' onClick={doCopy}>
                            <Copy className='h-4! w-4!' fill='currentColor' />
                            <span>{i18n.t('server:files.duplicate')}</span>
                        </ContextMenuItem>
                    </Can>
                )}
                {file.isArchiveType() ? (
                    <Can action={'file.create'}>
                        <ContextMenuItem
                            className='flex gap-2'
                            onSelect={doUnarchive}
                            title={i18n.t('server:files.unarchive')}
                        >
                            <FileZipper className='h-4! w-4!' fill='currentColor' />
                            <span>{i18n.t('server:files.unarchive')}</span>
                        </ContextMenuItem>
                    </Can>
                ) : (
                    <Can action={'file.archive'}>
                        <ContextMenuItem className='flex gap-2' onSelect={doArchive}>
                            <FileZipper className='h-4! w-4!' fill='currentColor' />
                            <span>{i18n.t('server:files.archive')}</span>
                        </ContextMenuItem>
                    </Can>
                )}
                {file.isFile && (
                    <ContextMenuItem className='flex gap-2' onSelect={doDownload}>
                        <FileArrowDown className='h-4! w-4!' fill='currentColor' />
                        <span>{i18n.t('server:files.download')}</span>
                    </ContextMenuItem>
                )}
                <Can action={'file.delete'}>
                    <ContextMenuItem className='flex gap-2' onSelect={() => setShowConfirmation(true)}>
                        <TrashBin className='h-4! w-4!' fill='currentColor' />
                        <span>{i18n.t('server:files.move_to_trash')}</span>
                    </ContextMenuItem>
                </Can>
            </ContextMenuContent>
        </>
    );
};

export default memo(FileDropdownMenu, isEqual);
