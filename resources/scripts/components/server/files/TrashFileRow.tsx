import { File, FolderOpenFill } from '@gravity-ui/icons';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { memo, useCallback, useMemo, useState } from 'react';

import i18n from '@/lib/i18n';

import { Checkbox } from '@/components/elements/CheckboxNew';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from '@/components/elements/ContextMenu';
import { Dialog } from '@/components/elements/dialog';

import emptyTrash from '@/api/server/files/emptyTrash';
import { TrashedFile } from '@/api/server/files/loadTrash';
import restoreTrash from '@/api/server/files/restoreTrash';

import { ServerContext } from '@/state/server';

import useFlash from '@/plugins/useFlash';

import styles from './style.module.css';

interface Props {
    file: TrashedFile;
    selected: boolean;
    onSelect: (uuid: string) => void;
    onEnter: () => void;
    onRestored: () => void;
    onDeleted: () => void;
    retentionDays: number;
}

const TrashFileRow = ({ file, selected, onSelect, onEnter, onRestored, onDeleted, retentionDays }: Props) => {
    const [showDelete, setShowDelete] = useState(false);
    const [showRestore, setShowRestore] = useState(false);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { clearAndAddHttpError } = useFlash();

    const timeRemaining = useMemo(() => {
        const trashedAt = new Date(file.trashed_at);
        const expiresAt = new Date(trashedAt.getTime() + retentionDays * 24 * 60 * 60 * 1000);
        const now = new Date();
        const diffMs = expiresAt.getTime() - now.getTime();
        if (diffMs <= 0) return 'Expired';
        const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
        if (diffHours < 24) return `${diffHours}h remaining`;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return `${diffDays}d remaining`;
    }, [file.trashed_at, retentionDays]);

    const handleRestore = useCallback(() => {
        restoreTrash(uuid, file.uuid)
            .then(() => onRestored())
            .catch((error) => clearAndAddHttpError({ key: 'files', error }));
        setShowRestore(false);
    }, [uuid, file.uuid, onRestored]);

    const handleDelete = useCallback(() => {
        emptyTrash(uuid, file.uuid)
            .then(() => onDeleted())
            .catch((error) => clearAndAddHttpError({ key: 'files', error }));
        setShowDelete(false);
    }, [uuid, file.uuid, onDeleted]);

    return (
        <>
            <Dialog.Confirm
                open={showRestore}
                onClose={() => setShowRestore(false)}
                title={`Restore ${file.original_name}`}
                confirm={i18n.t('server:files.restore_confirm')}
                onConfirmed={handleRestore}
            >
                Restore <span className='font-semibold text-zinc-50'>{file.original_name}</span> to its original
                location?
            </Dialog.Confirm>
            <Dialog.Confirm
                open={showDelete}
                onClose={() => setShowDelete(false)}
                title={`Delete ${file.original_name}`}
                confirm={i18n.t('server:files.delete_title')}
                onConfirmed={handleDelete}
            >
                This will permanently delete <span className='font-semibold text-zinc-50'>{file.original_name}</span>.
                This action cannot be undone.
            </Dialog.Confirm>
            <ContextMenu>
                <ContextMenuTrigger asChild>
                    <div className={styles.file_row} onClick={onEnter}>
                        <Checkbox className='ml-4' checked={selected} onCheckedChange={() => onSelect(file.uuid)} />
                        <div className={styles.details}>
                            <div className={`flex-none text-zinc-400 mr-4 text-lg pl-3 mb-0.5`}>
                                {file.is_directory ? (
                                    <FolderOpenFill width={22} height={22} />
                                ) : (
                                    <File width={22} height={22} />
                                )}
                            </div>
                            <div className='flex-1 truncate font-bold text-sm'>{file.original_name}</div>
                            <div className='w-1/6 text-right mr-4 hidden sm:block text-xs text-zinc-500'>
                                {file.original_root === '/' ? '/' : `/${file.original_root}`}
                            </div>
                            <div className='w-1/5 text-right mr-4 hidden md:block text-xs text-zinc-500'>
                                {timeRemaining}
                            </div>
                        </div>
                    </div>
                </ContextMenuTrigger>
                <ContextMenuContent className='flex flex-col gap-1'>
                    <ContextMenuItem className='flex gap-2' onSelect={() => setShowRestore(true)}>
                        <span>{i18n.t('server:files.restore_confirm')}</span>
                    </ContextMenuItem>
                    <ContextMenuItem className='flex gap-2' onSelect={() => setShowDelete(true)}>
                        <span>{i18n.t('server:files.delete_title')}</span>
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
        </>
    );
};

export default memo(TrashFileRow, (prev, next) => prev.file.uuid === next.file.uuid && prev.selected === next.selected);
