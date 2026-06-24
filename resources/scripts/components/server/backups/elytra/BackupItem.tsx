import { Cloud, CloudArrowUpIn, Lock } from '@gravity-ui/icons';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

import Can from '@/components/elements/Can';
import { Checkbox } from '@/components/elements/CheckboxNew';
import Spinner from '@/components/elements/Spinner';
import { PageListItem } from '@/components/elements/pages/PageList';

import i18n from '@/lib/i18n';

import useFlash from '@/plugins/useFlash';
import useFormatBytes from '@/plugins/useFormatBytes';

import BackupContextMenu from './BackupContextMenu';

const translateDaemonMessage = (msg: string | null | undefined): string | null => {
    if (!msg) return null;
    const map: Record<string, string> = {
        'Generating backup archive...': i18n.t('server:shell.dm_generating_archive'),
        'Calculating repository size...': i18n.t('server:shell.dm_calculating_size'),
        'Verifying backup integrity...': i18n.t('server:shell.dm_verifying_integrity'),
        'Uploading backup parts...': i18n.t('server:shell.dm_uploading_parts'),
        'Finalizing backup...': i18n.t('server:shell.dm_finalizing_backup'),
        'Creating backup snapshot...': i18n.t('server:shell.dm_creating_snapshot'),
        'Cleaning up temporary files...': i18n.t('server:shell.dm_cleaning_up'),
        'Downloading backup parts...': i18n.t('server:shell.dm_downloading_parts'),
        'Job completed successfully': i18n.t('server:shell.dm_job_completed'),
        'Locating rustic S3 backup...': i18n.t('server:shell.dm_locating_rustic'),
        'Deleting rustic S3 backup...': i18n.t('server:shell.dm_deleting_rustic'),
        'Creating backup before proceeding...': i18n.t('server:shell.dm_creating_backup'),
        'Wiping server files...': i18n.t('server:shell.dm_wiping_files'),
    };
    if (map[msg]) return map[msg];
    const match = msg.match(/^Backup in progress\.\.\. (\d+)%$/);
    if (match) return i18n.t('server:shell.op_backup_progress', { progress: match[1] });
    return msg;
};

export interface UnifiedBackup {
    uuid: string;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    progress: number;
    message: string;
    isSuccessful?: boolean;
    isLocked: boolean;
    isAutomatic: boolean;
    checksum?: string;
    bytes?: number;
    createdAt: Date;
    completedAt?: Date | null;
    canRetry: boolean;
    canDelete: boolean;
    canDownload: boolean;
    canRestore: boolean;
    isLiveOnly: boolean;
    isDeletion?: boolean;
}

interface Props {
    backup: UnifiedBackup;
    isSelected?: boolean;
    onToggleSelect?: () => void;
    isSelectable?: boolean;
    retryBackup: (backupUuid: string) => Promise<void>;
}

const BackupItem = ({ backup, isSelected = false, onToggleSelect, isSelectable = false, retryBackup }: Props) => {
    const { addFlash, clearFlashes } = useFlash();
    const formatBytes = useFormatBytes();

    const handleRetry = async () => {
        if (!backup.canRetry) return;

        try {
            clearFlashes('backup');
            await retryBackup(backup.uuid);
            addFlash({
                type: 'success',
                title: i18n.t('strings:success'),
                key: 'backup',
                message: i18n.t('server:backups.retrying'),
            });
        } catch (error) {
            addFlash({
                type: 'error',
                title: i18n.t('strings:error'),
                key: 'backup',
                message: error instanceof Error ? error.message : i18n.t('server:backups.retry_failed'),
            });
        }
    };

    const getStatusIcon = () => {
        const isActive = backup.status === 'running' || backup.status === 'pending';

        if (isActive) {
            return <Spinner size={'small'} />;
        } else if (backup.isLocked) {
            return <Lock width={22} height={22} className='text-red-400 ' fill='currentColor' />;
        } else if (backup.status === 'completed' || backup.isSuccessful) {
            return <Cloud width={22} height={22} className='text-green-400 ' fill='currentColor' />;
        } else {
            return <Cloud width={22} height={22} className='text-red-400 ' fill='currentColor' />;
        }
    };

    const getStatusBadge = () => {
        switch (backup.status) {
            case 'failed':
                return (
                    <span className='bg-red-500/20 border border-red-500/30 py-0.5 px-2 rounded text-red-300 text-xs font-medium'>
                        {i18n.t('server:shell.job_failed')}
                    </span>
                );
            case 'pending':
                return (
                    <span className='bg-yellow-500/20 border border-yellow-500/30 py-0.5 px-2 rounded text-yellow-300 text-xs font-medium'>
                        {i18n.t('server:shell.job_pending')}
                    </span>
                );
            case 'running':
                return (
                    <span className='bg-blue-500/20 border border-blue-500/30 py-0.5 px-2 rounded text-blue-300 text-xs font-medium'>
                        {i18n.t('server:shell.job_running')} ({backup.progress}%)
                    </span>
                );
            case 'completed':
                // Don't show "Completed" badge for deletion operations
                if (backup.isDeletion) {
                    return null;
                }
                return backup.isLiveOnly ? (
                    <span className='bg-green-500/20 border border-green-500/30 py-0.5 px-2 rounded text-green-300 text-xs font-medium'>
                        {i18n.t('server:shell.job_completed')}
                    </span>
                ) : null;
            case 'cancelled':
                return (
                    <span className='bg-gray-500/20 border border-gray-500/30 py-0.5 px-2 rounded text-gray-300 text-xs font-medium'>
                        {i18n.t('server:shell.job_cancelled')}
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
            <div className='flex items-center gap-3 w-full'>
                {/* Selection checkbox - always reserve space to prevent layout shift */}
                <div className='flex-shrink-0 w-5'>
                    {isSelectable && onToggleSelect ? (
                        <Checkbox
                            checked={isSelected}
                            onCheckedChange={onToggleSelect}
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        />
                    ) : (
                        <div className='w-5 h-5' />
                    )}
                </div>

                <div className='flex-shrink-0 w-9 h-9 rounded-lg bg-[#ffffff11] flex items-center justify-center'>
                    {getStatusIcon()}
                </div>

                <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 mb-1.5'>
                        {getStatusBadge()}
                        <h3 className='text-sm font-medium text-zinc-100 truncate'>{backup.name}</h3>
                        {backup.isAutomatic && (
                            <span className='text-xs text-blue-400 font-medium bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded'>
                                {i18n.t('server:shell.backup_automatic')}
                            </span>
                        )}
                        {backup.isLocked && (
                            <span className='text-xs text-red-400 font-medium bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded'>
                                {i18n.t('server:backups.locked_label')}
                            </span>
                        )}
                    </div>

                    {/* Progress bar for active backups */}
                    {showProgressBar && (
                        <div className='mb-2'>
                            <div className='flex justify-between text-xs text-zinc-400 mb-1.5'>
                                <span>{translateDaemonMessage(backup.message) || i18n.t('server:operations.processing')}</span>
                                <span>{backup.progress}%</span>
                            </div>
                            <div className='w-full bg-zinc-700 rounded-full h-2'>
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
                        <p className='text-xs text-red-400 truncate mb-1.5'>{translateDaemonMessage(backup.message)}</p>
                    )}

                    {backup.checksum && <p className='text-xs text-zinc-400 font-mono truncate'>{backup.checksum}</p>}
                </div>

                {/* Size info for completed backups */}
                <div className='hidden sm:block flex-shrink-0 text-right min-w-[90px]'>
                    {backup.completedAt && backup.isSuccessful && backup.bytes ? (
                        <>
                            <p className='text-xs text-zinc-500 uppercase tracking-wide mb-1'>
                                {i18n.t('server:backups.size_label')}
                            </p>
                            <p className='text-sm text-zinc-300 font-medium'>{formatBytes(backup.bytes)}</p>
                        </>
                    ) : (
                        <>
                            <p className='text-xs text-transparent uppercase tracking-wide mb-1'>
                                {i18n.t('server:backups.size_label')}
                            </p>
                            <p className='text-sm text-transparent font-medium'>-</p>
                        </>
                    )}
                </div>

                {/* Created time */}
                <div className='hidden sm:block flex-shrink-0 text-right min-w-[130px]'>
                    <p className='text-xs text-zinc-500 uppercase tracking-wide mb-1'>{i18n.t('strings:created')}</p>
                    <p
                        className='text-sm text-zinc-300 font-medium'
                        title={i18n.language === 'es'
                            ? format(backup.createdAt, "d 'de' MMMM 'de' yyyy, HH:mm:ss", { locale: es })
                            : format(backup.createdAt, 'ddd, MMMM do, yyyy HH:mm:ss')
                        }
                    >
                        {formatDistanceToNow(backup.createdAt, {
                            includeSeconds: true,
                            addSuffix: true,
                            locale: i18n.language === 'es' ? es : undefined,
                        })}
                    </p>
                </div>

                {/* Actions - fixed width to prevent layout shifts */}
                <div className='flex-shrink-0 flex items-center gap-2 min-w-[68px] justify-end'>
                    {/* Retry button for failed backups */}
                    {backup.status === 'failed' && backup.canRetry && (
                        <Can action='backup.create'>
                            <button
                                onClick={handleRetry}
                                className='p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors'
                                title={i18n.t('server:backups.retry_backup')}
                            >
                                <CloudArrowUpIn width={22} height={22} />
                            </button>
                        </Can>
                    )}

                    {/* Context menu for actionable backups */}
                    <Can action={['backup.download', 'backup.restore', 'backup.delete']} matchAny>
                        {!isActive && !backup.isLiveOnly && (
                            <BackupContextMenu
                                backup={{
                                    uuid: backup.uuid,
                                    name: backup.name,
                                    isSuccessful: backup.isSuccessful || false,
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
