import { TriangleExclamation } from '@gravity-ui/icons';
import React, { useEffect, useState } from 'react';

import ActionButton from '@/components/elements/ActionButton';
import Spinner from '@/components/elements/Spinner';
import { Dialog } from '@/components/elements/dialog';

import i18n from '@/lib/i18n';
import {
    UI_CONFIG,
    canCloseOperation,
    formatOperationId,
    getStatusIconType,
    getStatusStyling,
    isActiveStatus,
    isCompletedStatus,
    isFailedStatus,
} from '@/lib/server-operations';

import { ServerOperation, useOperationPolling } from '@/api/server/serverOperations';

import { ServerContext } from '@/state/server';

interface Props {
    visible: boolean;
    operationId: string | null;
    operationType: string;
    onClose: () => void;
    onComplete?: (operation: ServerOperation) => void;
    onError?: (error: Error) => void;
}

/**
 * Modal component for displaying server operation progress in real-time.
 * Handles polling, auto-close, and status updates for long-running operations.
 */
const OperationProgressModal: React.FC<Props> = ({
    visible,
    operationId,
    operationType,
    onClose,
    onComplete,
    onError,
}) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [operation, setOperation] = useState<ServerOperation | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [autoCloseTimer, setAutoCloseTimer] = useState<NodeJS.Timeout | null>(null);
    const { startPolling, stopPolling } = useOperationPolling();

    useEffect(() => {
        if (!visible || !operationId) {
            stopPolling(operationId || '');
            setOperation(null);
            setError(null);
            if (autoCloseTimer) {
                clearTimeout(autoCloseTimer);
                setAutoCloseTimer(null);
            }
            return;
        }

        const handleUpdate = (op: ServerOperation) => {
            setOperation(op);
        };

        const handleComplete = (op: ServerOperation) => {
            setOperation(op);
            stopPolling(operationId);

            if (onComplete) {
                onComplete(op);
            }

            if (op.is_completed) {
                const timer = setTimeout(() => {
                    onClose();
                }, UI_CONFIG.AUTO_CLOSE_DELAY);
                setAutoCloseTimer(timer);
            }
        };

        const handleError = (err: Error) => {
            setError(err.message);
            stopPolling(operationId);

            if (onError) {
                onError(err);
            }
        };

        startPolling(uuid, operationId, handleUpdate, handleComplete, handleError);

        return () => {
            stopPolling(operationId);
            if (autoCloseTimer) {
                clearTimeout(autoCloseTimer);
            }
        };
    }, [visible, operationId, uuid, startPolling, stopPolling, onComplete, onError, onClose, autoCloseTimer]);

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            pending: i18n.t('server:shell.job_pending'),
            running: i18n.t('server:shell.job_running'),
            completed: i18n.t('server:shell.job_completed'),
            failed: i18n.t('server:shell.job_failed'),
            cancelled: i18n.t('server:shell.job_cancelled'),
        };
        return labels[status] || status;
    };

    const translateMessage = (msg: string | null) => {
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
            'Locating rustic local backup...': i18n.t('server:shell.dm_locating_rustic_local'),
            'Deleting rustic local backup...': i18n.t('server:shell.dm_deleting_rustic_local'),
            'Creating backup before proceeding...': i18n.t('server:shell.dm_creating_backup'),
            'Wiping server files...': i18n.t('server:shell.dm_wiping_files'),
            // src/jobs/backup_job.go:91
            'Backup creation queued': i18n.t('server:shell.dm_backup_creation_queued'),
            // src/jobs/backup_job.go:204
            'Locating server...': i18n.t('server:shell.dm_locating_server'),
            // src/jobs/backup_job.go:216
            'Initializing backup adapter...': i18n.t('server:shell.dm_initializing_adapter'),
            // src/jobs/backup_job.go:244
            'Starting backup generation...': i18n.t('server:shell.dm_starting_generation'),
            // src/jobs/backup_job.go:265
            'Reading server ignore patterns...': i18n.t('server:shell.dm_reading_ignore_patterns'),
            // src/jobs/backup_job.go:124
            'Backup deletion queued': i18n.t('server:shell.dm_backup_deletion_queued'),
            // src/jobs/backup_job.go:395
            'Locating local backup...': i18n.t('server:shell.dm_locating_local'),
            // src/jobs/backup_job.go:402
            'Deleting local backup...': i18n.t('server:shell.dm_deleting_local'),
            // src/jobs/backup_job.go:420
            'Deleting S3 backup...': i18n.t('server:shell.dm_deleting_s3'),
            // src/jobs/backup_job.go:439
            'Getting rustic local configuration...': i18n.t('server:shell.dm_getting_rustic_local_config'),
            // src/jobs/backup_job.go:547
            'Getting rustic S3 configuration...': i18n.t('server:shell.dm_getting_rustic_s3_config'),
            // src/jobs/backup_job.go:408
            'Backup deleted successfully': i18n.t('server:shell.dm_backup_deleted'),
            // src/jobs/backup_job.go:493
            'Backup already deleted - cleanup successful': i18n.t('server:shell.dm_backup_already_deleted'),
            // src/jobs/backup_job.go:162
            'Backup restoration queued': i18n.t('server:shell.dm_backup_restoration_queued'),
            // src/jobs/backup_job.go:703
            'Preparing for backup restoration...': i18n.t('server:shell.dm_preparing_restoration'),
            // src/jobs/backup_job.go:720
            'Preparing server for restore...': i18n.t('server:shell.dm_preparing_server_restore'),
            // src/jobs/backup_job.go:723
            'Truncating server directory...': i18n.t('server:shell.dm_truncating_directory'),
            // src/jobs/backup_job.go:756
            'Locating backup...': i18n.t('server:shell.dm_locating_backup'),
            // src/jobs/backup_job.go:787
            'Starting restoration process...': i18n.t('server:shell.dm_starting_restoration'),
            // src/jobs/backup_job.go:795
            'Publishing completion events...': i18n.t('server:shell.dm_publishing_events'),
            // src/jobs/backup_job.go:800
            'Backup restored successfully': i18n.t('server:shell.dm_backup_restored'),
            // src/jobs/backup_job.go:813
            'Getting rustic configuration...': i18n.t('server:shell.dm_getting_rustic_config'),
            // src/jobs/backup_job.go:820
            'Locating rustic backup...': i18n.t('server:shell.dm_locating_rustic_backup'),
            // src/jobs/backup_job.go:859
            'Downloading S3 backup...': i18n.t('server:shell.dm_downloading_s3'),
            // src/jobs/backup_job.go:874
            'Establishing connection to S3...': i18n.t('server:shell.dm_establishing_s3_connection'),
            // src/jobs/backup_job.go:882
            'Downloading backup archive...': i18n.t('server:shell.dm_downloading_archive'),
            // src/jobs/backup_job.go:901
            'Starting file restoration...': i18n.t('server:shell.dm_starting_file_restoration'),
            // src/jobs/backup_job.go:797
            'Completed server restoration from local backup.': i18n.t('server:shell.dm_restore_completed_local'),
            // src/jobs/backup_job.go:842
            'Completed server restoration from rustic backup.': i18n.t('server:shell.dm_restore_completed_rustic'),
            // src/jobs/backup_job.go:958
            'Completed server restoration from S3 backup.': i18n.t('server:shell.dm_restore_completed_s3'),
            // src/jobs/backup_job.go:1005
            'Delete all backups queued': i18n.t('server:shell.dm_delete_all_queued'),
            // src/jobs/backup_job.go:1136
            'Checking for rustic repositories...': i18n.t('server:shell.dm_checking_rustic_repos'),
            // src/jobs/backup_job.go:1185
            'Destroying repositories...': i18n.t('server:shell.dm_destroying_repos'),
            // src/jobs/backup_job.go:1229
            'All backups and repositories destroyed': i18n.t('server:shell.dm_all_destroyed'),
            // src/jobs/job.go:130
            'Job queued': i18n.t('server:shell.dm_job_queued'),
            // src/jobs/job.go:237
            'Job executing': i18n.t('server:shell.dm_job_executing'),
            // src/jobs/job.go:256
            'Job failed': i18n.t('server:shell.dm_job_failed'),
            // src/jobs/job.go:182
            'Job cancelled': i18n.t('server:shell.dm_job_cancelled'),
            // src/jobs/job.go:183
            'Cancelled by user': i18n.t('server:shell.dm_cancelled_by_user'),
        };
        if (map[msg]) return map[msg];
        // Handle "Backup in progress... X%" pattern from daemon (src/jobs/backup_job.go)
        const backupProgressMatch = msg.match(/^Backup in progress\.\.\. (\d+)%$/);
        if (backupProgressMatch) {
            return i18n.t('server:shell.op_backup_progress', { progress: backupProgressMatch[1] });
        }
        // Handle "Deleting X backup files..." (src/jobs/backup_job.go:1052)
        const deletingFilesMatch = msg.match(/^Deleting (\d+) backup files\.\.\.$/);
        if (deletingFilesMatch) {
            return i18n.t('server:shell.dm_deleting_backup_files', { count: deletingFilesMatch[1] });
        }
        // Handle "Deleting backup X of Y..." (src/jobs/backup_job.go:1062)
        const deletingOfMatch = msg.match(/^Deleting backup (\d+) of (\d+)\.\.\.$/);
        if (deletingOfMatch) {
            return i18n.t('server:shell.dm_deleting_backup_of', { current: deletingOfMatch[1], total: deletingOfMatch[2] });
        }
        return msg;
    };

    const renderStatusIcon = (status: string) => {
        const iconType = getStatusIconType(status as any);

        switch (iconType) {
            case 'spinner':
                return <Spinner size={'small'} />;
            case 'success':
                return (
                    <div className='w-5 h-5 rounded-full bg-green-400 flex items-center justify-center'>
                        <div className='w-2 h-2 rounded-full bg-white' />
                    </div>
                );
            case 'error':
                return (
                    <TriangleExclamation width={22} height={22} fill='currentColor' className='w-5 h-5 text-red-400' />
                );
            default:
                return <Spinner size={'small'} />;
        }
    };

    const canClose = canCloseOperation(operation, error);
    const statusStyling = operation ? getStatusStyling(operation.status) : null;

    const handleClose = () => {
        if (autoCloseTimer) {
            clearTimeout(autoCloseTimer);
            setAutoCloseTimer(null);
        }
        onClose();
    };

    return (
        <Dialog
            open={visible}
            onClose={canClose ? handleClose : () => {}}
            preventExternalClose={!canClose}
            hideCloseIcon={!canClose}
            title={operationType}
        >
            <div className='space-y-4'>
                {/* Operation ID */}
                {operationId && (
                    <div className='flex justify-center'>
                        <div className='px-3 py-1.5 bg-[#ffffff11] border border-[#ffffff12] rounded-lg'>
                            <p className='text-xs text-zinc-400 font-mono'>
                                {i18n.t('server:operations.id_label')} {formatOperationId(operationId)}
                            </p>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error ? (
                    <div className='space-y-4'>
                        <div className='flex items-center justify-center space-x-3'>
                            <TriangleExclamation
                                width={22}
                                height={22}
                                fill='currentColor'
                                className='w-6 h-6 text-red-400'
                            />
                            <span className='text-red-400 font-semibold text-lg'>
                                {i18n.t('server:operations.error_label')}
                            </span>
                        </div>
                        <div className='p-4 bg-red-500/10 border border-red-500/20 rounded-lg'>
                            <p className='text-sm text-red-300'>{error}</p>
                        </div>
                    </div>
                ) : operation ? (
                    /* Operation State */
                    <div className='space-y-4'>
                        {/* Status Header */}
                        <div className='flex items-center justify-center space-x-3'>
                            {renderStatusIcon(operation.status)}
                            <span
                                className={`font-semibold capitalize text-lg ${statusStyling?.color || 'text-zinc-300'}`}
                            >
                                {getStatusLabel(operation.status)}
                            </span>
                        </div>

                        {/* Message Box */}
                        <div className='p-4 bg-[#ffffff11] border border-[#ffffff12] rounded-lg'>
                            <p className='text-sm text-zinc-300 text-center'>
                                {translateMessage(operation.message) || i18n.t('server:operations.processing')}
                            </p>
                        </div>

                        {/* Progress Bar for Active Operations */}
                        {isActiveStatus(operation.status) && (
                            <div className='space-y-3'>
                                <div className='w-full bg-[#ffffff11] rounded-full h-2 border border-[#ffffff12]'>
                                    <div
                                        className='bg-brand h-2 rounded-full animate-pulse transition-all duration-500 ease-out'
                                        style={{ width: `${UI_CONFIG.ESTIMATED_PROGRESS_WIDTH}%` }}
                                    />
                                </div>
                                <p className='text-xs text-zinc-500 text-center'>
                                    {i18n.t('server:operations.auto_close')}
                                </p>
                            </div>
                        )}

                        {/* Success State */}
                        {isCompletedStatus(operation.status) && (
                            <div className='p-4 bg-green-500/10 border border-green-500/20 rounded-lg'>
                                <div className='flex items-center justify-center space-x-2 mb-2'>
                                    <div className='w-5 h-5 rounded-full bg-green-400 flex items-center justify-center'>
                                        <div className='w-2 h-2 rounded-full bg-white' />
                                    </div>
                                    <p className='text-sm text-green-300 font-medium'>
                                        {i18n.t('server:operations.completed')}
                                    </p>
                                </div>
                                {autoCloseTimer && (
                                    <p className='text-xs text-green-200 text-center'>
                                        {i18n.t('server:operations.closing_auto', {
                                            seconds: UI_CONFIG.AUTO_CLOSE_DELAY / 1000,
                                        })}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Failed State */}
                        {isFailedStatus(operation.status) && (
                            <div className='p-4 bg-red-500/10 border border-red-500/20 rounded-lg'>
                                <div className='flex items-center justify-center space-x-2 mb-2'>
                                    <TriangleExclamation
                                        width={22}
                                        height={22}
                                        fill='currentColor'
                                        className='w-5 h-5 text-red-400'
                                    />
                                    <p className='text-sm text-red-300 font-medium'>
                                        {i18n.t('server:operations.failed')}
                                    </p>
                                </div>
                                {operation.message && (
                                    <p className='text-xs text-red-200 text-center'>{operation.message}</p>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    /* Loading State */
                    <div className='flex items-center justify-center space-x-3 py-4'>
                        <Spinner size={'small'} />
                        <span className='text-zinc-400 font-medium'>{i18n.t('server:operations.initializing')}</span>
                    </div>
                )}
            </div>

            {canClose && (
                <Dialog.Footer>
                    <ActionButton onClick={handleClose} variant='secondary' className='mr-3'>
                        {i18n.t('server:operations.cancel')}
                    </ActionButton>
                    <ActionButton onClick={handleClose} variant='primary'>
                        {operation?.is_completed ? i18n.t('server:operations.done') : i18n.t('server:operations.close')}
                    </ActionButton>
                </Dialog.Footer>
            )}
        </Dialog>
    );
};

export default OperationProgressModal;
