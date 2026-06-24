import { Cloud, Lock } from '@gravity-ui/icons';

import { format, formatDistanceToNow } from 'date-fns';
import type { ServerBackup } from '@/api/server/types';
import getServerBackups from '@/api/swr/getServerBackups';
import Can from '@/components/elements/Can';
import { ContextMenu, ContextMenuTrigger } from '@/components/elements/ContextMenu';
import { PageListItem } from '@/components/elements/pages/PageList';
import Spinner from '@/components/elements/Spinner';
import { SocketEvent } from '@/components/server/events';
import { bytesToString } from '@/lib/formatters';

// import Can from '@/components/elements/Can';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';

import BackupContextMenu from './BackupContextMenu';

interface Props {
    backup: ServerBackup;
}

const BackupItem = ({ backup }: Props) => {
    const { mutate } = getServerBackups();

    useWebsocketEvent(`${SocketEvent.BACKUP_COMPLETED}:${backup.uuid}` as SocketEvent, async (data) => {
        try {
            const parsed = JSON.parse(data);

            await mutate(
                (data) => ({
                    ...data!,
                    items: data!.items.map((b) =>
                        b.uuid === backup.uuid
                            ? {
                                  ...b,
                                  isSuccessful: true,
                                  checksum: (parsed.checksum_type || '') + ':' + (parsed.checksum || ''),
                                  bytes: parsed.file_size || 0,
                                  completedAt: new Date(),
                              }
                            : b,
                    ),
                }),
                false,
            );
        } catch (e) {
            console.warn(e);
        }
    });

    const getStatusIcon = () => {
        const isActive = backup.isInProgress === true || backup.isInProgress === false;
        if (backup.completedAt === null) {
            return <Spinner size={'small'} />;
        }
        if (isActive) {
            return <Spinner size={'small'} />;
        }
        if (backup.isLocked) {
            return <Lock className='text-red-400' fill='currentColor' height={22} width={22} />;
        }
        if (backup.isInProgress === true || backup.isSuccessful) {
            return <Cloud className='text-green-400' fill='currentColor' height={22} width={22} />;
        }
        return <Cloud className='text-red-400' fill='currentColor' height={22} width={22} />;
    };

    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <PageListItem>
                    <div className='flex w-full items-center gap-3'>
                        <div className='flex flex-row items-center gap-6 truncate align-middle'>
                            <div className='flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#ffffff11]'>
                                {getStatusIcon()}
                            </div>
                            <div className='min-w-0 flex-1'>
                                <div className='mb-1.5 flex items-center gap-2'>
                                    <h3 className='truncate font-medium text-sm text-zinc-100'>{backup.name}</h3>
                                    {backup.isAutomatic && (
                                        <span className='rounded border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 font-medium text-blue-400 text-xs'>
                                            Automatic
                                        </span>
                                    )}
                                    {backup.isLocked && (
                                        <span className='rounded border border-red-500/20 bg-red-500/10 px-2 py-0.5 font-medium text-red-400 text-xs'>
                                            Locked
                                        </span>
                                    )}
                                </div>
                                {backup.checksum && (
                                    <p className='truncate font-mono text-xs text-zinc-400'>{backup.checksum}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className='visible min-w-[90px] flex-shrink-0 text-right sm:block'>
                        {backup.completedAt && backup.bytes ? (
                            <>
                                <p className='mb-1 text-xs text-zinc-500 uppercase tracking-wide'>Size</p>
                                <p className='font-medium text-sm text-zinc-300'>{bytesToString(backup.bytes)}</p>
                            </>
                        ) : (
                            <>
                                <p className='mb-1 text-transparent text-xs uppercase tracking-wide'>Size</p>
                                <p className='font-medium text-sm text-transparent'>-</p>
                            </>
                        )}
                    </div>

                    <div className='mr-5 hidden min-w-[130px] flex-shrink-0 text-right sm:block'>
                        <p className='mb-1 text-xs text-zinc-500 uppercase tracking-wide'>Created</p>
                        <p
                            className='font-medium text-sm text-zinc-300'
                            title={format(backup.createdAt, 'ddd, MMMM do, yyyy HH:mm:ss')}
                        >
                            {formatDistanceToNow(backup.createdAt, {
                                includeSeconds: true,
                                addSuffix: true,
                            })}
                        </p>
                    </div>

                    <Can action={['backup.download', 'backup.restore', 'backup.delete']} matchAny>
                        {backup.completedAt ? <BackupContextMenu backup={backup} /> : <></>}
                    </Can>
                </PageListItem>
            </ContextMenuTrigger>
        </ContextMenu>
    );
};

export default BackupItem;
