import { Cloud, CloudArrowUpIn, Lock } from '@gravity-ui/icons';
import { format, formatDistanceToNow } from 'date-fns';

import Can from '@/components/elements/Can';
import { Checkbox } from '@/components/elements/CheckboxNew';
import { PageListItem } from '@/components/elements/pages/PageList';
import Spinner from '@/components/elements/Spinner';

import { bytesToString } from '@/lib/formatters';

import useFlash from '@/plugins/useFlash';

import BackupContextMenu from './BackupContextMenu';

export interface UnifiedBackup {
    bytes?: number;
    canDelete: boolean;
    canDownload: boolean;
    canRestore: boolean;
    canRetry: boolean;
    checksum?: string;
    completedAt?: Date | null;
    createdAt: Date;
    isAutomatic: boolean;
    isDeletion?: boolean;
    isLiveOnly: boolean;
    isLocked: boolean;
    isSuccessful?: boolean;
    message: string;
    name: string;
    progress: number;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    uuid: string;
}

interface Props {
    backup: UnifiedBackup;
    isSelectable?: boolean;
    isSelected?: boolean;
    onToggleSelect?: () => void;
    retryBackup: (backupUuid: string) => Promise<void>;
}

const BackupItem = ({ backup, isSelected = false, onToggleSelect, isSelectable = false, retryBackup }: Props) => {
    const { addFlash, clearFlashes } = useFlash();

    const handleRetry = async () => {
        if (!backup.canRetry) return;

        try {
            clearFlashes('backup');
            await retryBackup(backup.uuid);
            addFlash({
                type: 'success',
                title: 'Success',
                key: 'backup',
                message: 'Backup is being retried.',
            });
        } catch (error) {
            addFlash({
                type: 'error',
                title: 'Error',
                key: 'backup',
                message: error instanceof Error ? error.message : 'Failed to retry backup.',
            });
        }
    };

    const getStatusIcon = () => {
        const isActive = backup.status === 'running' || backup.status === 'pending';

        if (isActive) {
            return <Spinner size={'small'} />;
        }
        if (backup.isLocked) {
            return <Lock className='text-red-400' fill='currentColor' height={22} width={22} />;
        }
        if (backup.status === 'completed' || backup.isSuccessful) {
            return <Cloud className='text-green-400' fill='currentColor' height={22} width={22} />;
        }
        return <Cloud className='text-red-400' fill='currentColor' height={22} width={22} />;
    };

    const getStatusBadge = () => {
        switch (backup.status) {
            case 'failed':
                return (
                    <span className='rounded border border-red-500/30 bg-red-500/20 px-2 py-0.5 font-medium text-red-300 text-xs'>
                        Failed
                    </span>
                );
            case 'pending':
                return (
                    <span className='rounded border border-yellow-500/30 bg-yellow-500/20 px-2 py-0.5 font-medium text-xs text-yellow-300'>
                        Pending
                    </span>
                );
            case 'running':
                return (
                    <span className='rounded border border-blue-500/30 bg-blue-500/20 px-2 py-0.5 font-medium text-blue-300 text-xs'>
                        Running ({backup.progress}%)
                    </span>
                );
            case 'completed':
                // Don't show "Completed" badge for deletion operations
                if (backup.isDeletion) {
                    return null;
                }
                return backup.isLiveOnly ? (
                    <span className='rounded border border-green-500/30 bg-green-500/20 px-2 py-0.5 font-medium text-green-300 text-xs'>
                        Completed
                    </span>
                ) : null;
            case 'cancelled':
                return (
                    <span className='rounded border border-gray-500/30 bg-gray-500/20 px-2 py-0.5 font-medium text-gray-300 text-xs'>
                        Cancelled
                    </span>
                );
            default:
                return null;
        }
    };

    const isActive = backup.status === 'running' || backup.status === 'pending';
    const showProgressBar = isActive || (backup.status === 'completed' && backup.isLiveOnly);

    return (
        <PageListItem>
            <div className='flex w-full items-center gap-3'>
                {/* Selection checkbox - always reserve space to prevent layout shift */}
                <div className='w-5 flex-shrink-0'>
                    {isSelectable && onToggleSelect ? (
                        <Checkbox
                            checked={isSelected}
                            onCheckedChange={onToggleSelect}
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        />
                    ) : (
                        <div className='h-5 w-5' />
                    )}
                </div>

                <div className='flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#ffffff11]'>
                    {getStatusIcon()}
                </div>

                <div className='min-w-0 flex-1'>
                    <div className='mb-1.5 flex items-center gap-2'>
                        {getStatusBadge()}
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

                    {/* Progress bar for active backups */}
                    {showProgressBar && (
                        <div className='mb-2'>
                            <div className='mb-1.5 flex justify-between text-xs text-zinc-400'>
                                <span>{backup.message || 'Processing...'}</span>
                                <span>{backup.progress}%</span>
                            </div>
                            <div className='h-2 w-full rounded-full bg-zinc-700'>
                                <div
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                        backup.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                                    }`}
                                    style={{ width: `${backup.progress || 0}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Error message for failed backups */}
                    {backup.status === 'failed' && backup.message && (
                        <p className='mb-1.5 truncate text-red-400 text-xs'>{backup.message}</p>
                    )}

                    {backup.checksum && <p className='truncate font-mono text-xs text-zinc-400'>{backup.checksum}</p>}
                </div>

                {/* Size info for completed backups */}
                <div className='hidden min-w-[90px] flex-shrink-0 text-right sm:block'>
                    {backup.completedAt && backup.isSuccessful && backup.bytes ? (
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

                {/* Created time */}
                <div className='hidden min-w-[130px] flex-shrink-0 text-right sm:block'>
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

                {/* Actions - fixed width to prevent layout shifts */}
                <div className='flex min-w-[68px] flex-shrink-0 items-center justify-end gap-2'>
                    {/* Retry button for failed backups */}
                    {backup.status === 'failed' && backup.canRetry && (
                        <Can action='backup.create'>
                            <button
                                className='rounded-lg border border-blue-500/20 bg-blue-500/10 p-2 text-blue-400 transition-colors hover:bg-blue-500/20'
                                onClick={handleRetry}
                                title='Retry backup'
                            >
                                <CloudArrowUpIn height={22} width={22} />
                            </button>
                        </Can>
                    )}

                    {/* Context menu for actionable backups */}
                    <Can action={['backup.download', 'backup.restore', 'backup.delete']} matchAny>
                        {!(isActive || backup.isLiveOnly) && (
                            <BackupContextMenu
                                backup={{
                                    uuid: backup.uuid,
                                    name: backup.name,
                                    isSuccessful: backup.isSuccessful,
                                    isLocked: backup.isLocked,
                                    checksum: backup.checksum || '',
                                    bytes: backup.bytes || 0,
                                    createdAt: backup.createdAt,
                                    completedAt: backup.completedAt,
                                    canRetry: backup.canRetry,
                                    jobStatus: backup.status,
                                    jobProgress: backup.progress,
                                    jobMessage: backup.message,
                                    jobId: '',
                                    jobError: null,
                                    object: 'backup' as const,
                                }}
                            />
                        )}
                    </Can>
                </div>
            </div>
        </PageListItem>
    );
};

export default BackupItem;
