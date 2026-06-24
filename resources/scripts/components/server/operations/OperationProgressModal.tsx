import { TriangleExclamation } from '@gravity-ui/icons';
import type React from 'react';
import { useEffect, useState } from 'react';
import { type ServerOperation, useOperationPolling } from '@/api/server/serverOperations';
import ActionButton from '@/components/elements/ActionButton';
import { Dialog } from '@/components/elements/dialog';
import Spinner from '@/components/elements/Spinner';
import {
    canCloseOperation,
    formatOperationId,
    getStatusIconType,
    getStatusStyling,
    isActiveStatus,
    isCompletedStatus,
    isFailedStatus,
    UI_CONFIG,
} from '@/lib/server-operations';

import { ServerContext } from '@/state/server';

interface Props {
    onClose: () => void;
    onComplete?: (operation: ServerOperation) => void;
    onError?: (error: Error) => void;
    operationId: string | null;
    operationType: string;
    visible: boolean;
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
        if (!(visible && operationId)) {
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

    const renderStatusIcon = (status: string) => {
        const iconType = getStatusIconType(status as any);

        switch (iconType) {
            case 'spinner':
                return <Spinner size={'small'} />;
            case 'success':
                return (
                    <div className='flex h-5 w-5 items-center justify-center rounded-full bg-green-400'>
                        <div className='h-2 w-2 rounded-full bg-white' />
                    </div>
                );
            case 'error':
                return (
                    <TriangleExclamation className='h-5 w-5 text-red-400' fill='currentColor' height={22} width={22} />
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
            hideCloseIcon={!canClose}
            onClose={canClose ? handleClose : () => {}}
            open={visible}
            preventExternalClose={!canClose}
            title={operationType}
        >
            <div className='space-y-4'>
                {/* Operation ID */}
                {operationId && (
                    <div className='flex justify-center'>
                        <div className='rounded-lg border border-[#ffffff12] bg-[#ffffff11] px-3 py-1.5'>
                            <p className='font-mono text-xs text-zinc-400'>ID: {formatOperationId(operationId)}</p>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error ? (
                    <div className='space-y-4'>
                        <div className='flex items-center justify-center space-x-3'>
                            <TriangleExclamation
                                className='h-6 w-6 text-red-400'
                                fill='currentColor'
                                height={22}
                                width={22}
                            />
                            <span className='font-semibold text-lg text-red-400'>Error</span>
                        </div>
                        <div className='rounded-lg border border-red-500/20 bg-red-500/10 p-4'>
                            <p className='text-red-300 text-sm'>{error}</p>
                        </div>
                    </div>
                ) : operation ? (
                    /* Operation State */
                    <div className='space-y-4'>
                        {/* Status Header */}
                        <div className='flex items-center justify-center space-x-3'>
                            {renderStatusIcon(operation.status)}
                            <span
                                className={`font-semibold text-lg capitalize ${statusStyling?.color || 'text-zinc-300'}`}
                            >
                                {operation.status}
                            </span>
                        </div>

                        {/* Message Box */}
                        <div className='rounded-lg border border-[#ffffff12] bg-[#ffffff11] p-4'>
                            <p className='text-center text-sm text-zinc-300'>{operation.message || 'Processing...'}</p>
                        </div>

                        {/* Progress Bar for Active Operations */}
                        {isActiveStatus(operation.status) && (
                            <div className='space-y-3'>
                                <div className='h-2 w-full rounded-full border border-[#ffffff12] bg-[#ffffff11]'>
                                    <div
                                        className='h-2 animate-pulse rounded-full bg-brand transition-all duration-500 ease-out'
                                        style={{ width: `${UI_CONFIG.ESTIMATED_PROGRESS_WIDTH}%` }}
                                    />
                                </div>
                                <p className='text-center text-xs text-zinc-500'>
                                    This window will close automatically when complete
                                </p>
                            </div>
                        )}

                        {/* Success State */}
                        {isCompletedStatus(operation.status) && (
                            <div className='rounded-lg border border-green-500/20 bg-green-500/10 p-4'>
                                <div className='mb-2 flex items-center justify-center space-x-2'>
                                    <div className='flex h-5 w-5 items-center justify-center rounded-full bg-green-400'>
                                        <div className='h-2 w-2 rounded-full bg-white' />
                                    </div>
                                    <p className='font-medium text-green-300 text-sm'>
                                        Operation completed successfully
                                    </p>
                                </div>
                                {autoCloseTimer && (
                                    <p className='text-center text-green-200 text-xs'>
                                        Closing automatically in 3 seconds
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Failed State */}
                        {isFailedStatus(operation.status) && (
                            <div className='rounded-lg border border-red-500/20 bg-red-500/10 p-4'>
                                <div className='mb-2 flex items-center justify-center space-x-2'>
                                    <TriangleExclamation
                                        className='h-5 w-5 text-red-400'
                                        fill='currentColor'
                                        height={22}
                                        width={22}
                                    />
                                    <p className='font-medium text-red-300 text-sm'>Operation failed</p>
                                </div>
                                {operation.message && (
                                    <p className='text-center text-red-200 text-xs'>{operation.message}</p>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    /* Loading State */
                    <div className='flex items-center justify-center space-x-3 py-4'>
                        <Spinner size={'small'} />
                        <span className='font-medium text-zinc-400'>Initializing...</span>
                    </div>
                )}
            </div>

            {canClose && (
                <Dialog.Footer>
                    <ActionButton className='mr-3' onClick={handleClose} variant='secondary'>
                        Cancel
                    </ActionButton>
                    <ActionButton onClick={handleClose} variant='primary'>
                        {operation?.is_completed ? 'Done' : 'Close'}
                    </ActionButton>
                </Dialog.Footer>
            )}
        </Dialog>
    );
};

export default OperationProgressModal;
