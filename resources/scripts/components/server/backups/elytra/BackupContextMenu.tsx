import {
    ArrowDownToLine,
    Bars,
    CloudArrowUpIn,
    Pencil,
    Shield,
    TrashBin,
    TriangleExclamation,
} from '@gravity-ui/icons';
import { useStoreState } from 'easy-peasy';
import { useEffect, useState } from 'react';
import http, { httpErrorToHuman } from '@/api/http';
import { getServerBackupDownloadUrl } from '@/api/server/backups';
import { getGlobalDaemonType } from '@/api/server/getServer';
import type { ServerBackup } from '@/api/server/types';
import ActionButton from '@/components/elements/ActionButton';
import Can from '@/components/elements/Can';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/elements/DropdownMenu';
import { Dialog } from '@/components/elements/dialog';
import Spinner from '@/components/elements/Spinner';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import FlashMessageRender from '@/components/FlashMessageRender';
import useFlash from '@/plugins/useFlash';
import type { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';
import { useUnifiedBackups } from '../useUnifiedBackups';

interface Props {
    backup: ServerBackup;
}

const BackupContextMenu = ({ backup }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const daemonType = getGlobalDaemonType();
    const setServerFromState = ServerContext.useStoreActions((actions) => actions.server.setServerFromState);
    const [modal, setModal] = useState('');
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [newName, setNewName] = useState(backup.name);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteTotpCode, setDeleteTotpCode] = useState('');
    const [restorePassword, setRestorePassword] = useState('');
    const [restoreTotpCode, setRestoreTotpCode] = useState('');
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { deleteBackup, restoreBackup, renameBackup, toggleBackupLock, refresh } = useUnifiedBackups();
    const hasTwoFactor = useStoreState((state: ApplicationStore) => state.user.data?.useTotp);

    const doDownload = () => {
        setLoading(true);
        clearFlashes('backups');
        getServerBackupDownloadUrl(uuid, backup.uuid)
            .then((url) => {
                // @ts-expect-error this is valid
                window.location = url;
            })
            .catch((error) => {
                clearAndAddHttpError({ key: 'backups', error });
            })
            .then(() => setLoading(false));
    };

    const doDeletion = async () => {
        if (!deletePassword) {
            addFlash({
                key: 'backup:delete',
                type: 'error',
                message: 'Password is required to delete this backup.',
            });
            return;
        }

        if (hasTwoFactor && !deleteTotpCode) {
            addFlash({
                key: 'backup:delete',
                type: 'error',
                message: 'Two-factor authentication code is required.',
            });
            return;
        }

        setLoading(true);
        clearFlashes('backup:delete');

        try {
            await http.delete(`/api/client/servers/${daemonType}/${uuid}/backups/${backup.uuid}`, {
                data: {
                    password: deletePassword,
                    ...(hasTwoFactor ? { totp_code: deleteTotpCode } : {}),
                },
            });

            setLoading(false);
            setModal('');
            setDeletePassword('');
            setDeleteTotpCode('');

            // Refresh the backup list to reflect the deletion
            await refresh();
        } catch (error) {
            clearAndAddHttpError({ key: 'backup:delete', error });
            setLoading(false);
        }
    };

    const doRestorationAction = async () => {
        if (!restorePassword) {
            addFlash({
                key: 'backup:restore',
                type: 'error',
                message: 'Password is required to restore this backup.',
            });
            return;
        }

        if (hasTwoFactor && !restoreTotpCode) {
            addFlash({
                key: 'backup:restore',
                type: 'error',
                message: 'Two-factor authentication code is required.',
            });
            return;
        }

        setLoading(true);
        clearFlashes('backup:restore');

        try {
            await http.post(`/api/client/servers/${daemonType}/${uuid}/backups/${backup.uuid}/restore`, {
                password: restorePassword,
                ...(hasTwoFactor ? { totp_code: restoreTotpCode } : {}),
            });

            // Set server status to restoring
            setServerFromState((s) => ({
                ...s,
                status: 'restoring_backup',
            }));

            setLoading(false);
            setModal('');
            setRestorePassword('');
            setRestoreTotpCode('');
        } catch (error) {
            clearAndAddHttpError({ key: 'backup:restore', error });
            setLoading(false);
        }
    };

    const onLockToggle = async () => {
        if (backup.isLocked && modal !== 'unlock') {
            return setModal('unlock');
        }

        try {
            await toggleBackupLock(backup.uuid);
            setModal('');
        } catch (error) {
            alert(httpErrorToHuman(error));
        }
    };

    const doRename = async () => {
        setLoading(true);
        clearFlashes('backups');

        try {
            await renameBackup(backup.uuid, newName.trim());
            setLoading(false);
            setModal('');
        } catch (error) {
            clearAndAddHttpError({ key: 'backups', error });
            setLoading(false);
            setModal('');
        }
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (modal === 'restore' && countdown > 0) {
            interval = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [modal, countdown]);

    useEffect(() => {
        if (modal === 'restore') {
            setCountdown(5);
        }
    }, [modal]);

    useEffect(() => {
        if (modal === 'rename') {
            setNewName(backup.name);
        }
    }, [modal, backup.name]);

    return (
        <>
            <Dialog onClose={() => setModal('')} open={modal === 'rename'} title='Rename Backup'>
                <div className='space-y-4'>
                    <div>
                        <label className='mb-2 block font-medium text-sm text-zinc-200'>Backup Name</label>
                        <input
                            className='w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-zinc-100 placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                            maxLength={191}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder='Enter backup name...'
                            type='text'
                            value={newName}
                        />
                    </div>
                </div>

                <Dialog.Footer>
                    <ActionButton onClick={() => setModal('')} variant='secondary'>
                        Cancel
                    </ActionButton>
                    <ActionButton
                        disabled={!newName.trim() || newName.trim() === backup.name}
                        onClick={doRename}
                        variant='primary'
                    >
                        Rename Backup
                    </ActionButton>
                </Dialog.Footer>
            </Dialog>
            <Dialog.Confirm
                onClose={() => setModal('')}
                onConfirmed={onLockToggle}
                open={modal === 'unlock'}
                title={`Unlock "${backup.name}"`}
            >
                This backup will no longer be protected from automated or accidental deletions.
            </Dialog.Confirm>
            <Dialog
                onClose={() => {
                    setModal('');
                    setRestorePassword('');
                    setRestoreTotpCode('');
                }}
                open={modal === 'restore'}
                title='Restore Backup'
            >
                <FlashMessageRender byKey={'backup:restore'} />
                <div className='space-y-4'>
                    <div className='space-y-2'>
                        <p className='font-medium text-sm text-zinc-200'>&quot;{backup.name}&quot;</p>
                        <p className='text-sm text-zinc-400'>
                            Your server will be stopped during the restoration process. You will not be able to control
                            the power state, access the file manager, or create additional backups until completed.
                        </p>
                    </div>

                    <div className='rounded-lg border border-red-500/20 bg-red-500/10 p-4'>
                        <div className='flex items-start space-x-3'>
                            <TriangleExclamation
                                className='mt-0.5 flex-shrink-0 text-red-400'
                                fill='currentColor'
                                height={22}
                                width={22}
                            />
                            <div className='space-y-1'>
                                <h4 className='font-medium text-red-200 text-sm'>
                                    Destructive Action - Complete Server Restore
                                </h4>
                                <p className='text-red-300 text-xs'>
                                    All current files and server configuration will be deleted and replaced with the
                                    backup data. This action cannot be undone.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className='space-y-3'>
                        <div>
                            <label className='mb-1 block font-medium text-sm text-zinc-300' htmlFor='restore-password'>
                                Password
                            </label>
                            <input
                                className='w-full rounded-lg border border-zinc-700 bg-[#ffffff17] px-4 py-2 text-sm outline-hidden focus:border-brand'
                                disabled={loading}
                                id='restore-password'
                                onChange={(e) => setRestorePassword(e.target.value)}
                                placeholder='Enter your password'
                                type='password'
                                value={restorePassword}
                            />
                        </div>

                        {hasTwoFactor && (
                            <div>
                                <label className='mb-1 block font-medium text-sm text-zinc-300' htmlFor='restore-totp'>
                                    Two-Factor Authentication Code
                                </label>
                                <input
                                    className='w-full rounded-lg border border-zinc-700 bg-[#ffffff17] px-4 py-2 text-sm outline-hidden focus:border-brand'
                                    disabled={loading}
                                    id='restore-totp'
                                    maxLength={6}
                                    onChange={(e) => setRestoreTotpCode(e.target.value.replace(/[^0-9]/g, ''))}
                                    placeholder='6-digit code'
                                    type='text'
                                    value={restoreTotpCode}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <Dialog.Footer>
                    <ActionButton
                        disabled={loading}
                        onClick={() => {
                            setModal('');
                            setRestorePassword('');
                            setRestoreTotpCode('');
                        }}
                        variant='secondary'
                    >
                        Cancel
                    </ActionButton>
                    <ActionButton
                        disabled={countdown > 0 || loading}
                        onClick={() => doRestorationAction()}
                        variant='danger'
                    >
                        {loading && <Spinner size='small' />}
                        {loading
                            ? 'Restoring...'
                            : countdown > 0
                              ? `Delete All & Restore (${countdown}s)`
                              : 'Delete All & Restore Backup'}
                    </ActionButton>
                </Dialog.Footer>
            </Dialog>
            <Dialog
                onClose={() => {
                    setModal('');
                    setDeletePassword('');
                    setDeleteTotpCode('');
                }}
                open={modal === 'delete'}
                title={`Delete "${backup.name}"`}
            >
                <FlashMessageRender byKey={'backup:delete'} />
                <div className='space-y-4'>
                    <p className='text-sm text-zinc-300'>
                        This is a permanent operation. The backup cannot be recovered once deleted.
                    </p>

                    <div className='rounded-lg border border-red-500/20 bg-red-500/10 p-4'>
                        <div className='flex items-start gap-3'>
                            <svg
                                className='mt-0.5 h-5 w-5 flex-shrink-0 text-red-400'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                />
                            </svg>
                            <div className='text-sm'>
                                <p className='font-medium text-red-300'>Warning</p>
                                <p className='mt-1 text-red-400'>
                                    The backup file and its snapshot will be permanently deleted.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className='space-y-3'>
                        <div>
                            <label className='mb-1 block font-medium text-sm text-zinc-300' htmlFor='delete-password'>
                                Password
                            </label>
                            <input
                                className='w-full rounded-lg border border-zinc-700 bg-[#ffffff17] px-4 py-2 text-sm outline-hidden focus:border-brand'
                                disabled={loading}
                                id='delete-password'
                                onChange={(e) => setDeletePassword(e.target.value)}
                                placeholder='Enter your password'
                                type='password'
                                value={deletePassword}
                            />
                        </div>

                        {hasTwoFactor && (
                            <div>
                                <label className='mb-1 block font-medium text-sm text-zinc-300' htmlFor='delete-totp'>
                                    Two-Factor Authentication Code
                                </label>
                                <input
                                    className='w-full rounded-lg border border-zinc-700 bg-[#ffffff17] px-4 py-2 text-sm outline-hidden focus:border-brand'
                                    disabled={loading}
                                    id='delete-totp'
                                    maxLength={6}
                                    onChange={(e) => setDeleteTotpCode(e.target.value.replace(/[^0-9]/g, ''))}
                                    placeholder='6-digit code'
                                    type='text'
                                    value={deleteTotpCode}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <Dialog.Footer>
                    <ActionButton
                        disabled={loading}
                        onClick={() => {
                            setModal('');
                            setDeletePassword('');
                            setDeleteTotpCode('');
                        }}
                        variant='secondary'
                    >
                        Cancel
                    </ActionButton>
                    <ActionButton disabled={loading} onClick={doDeletion} variant='danger'>
                        {loading && <Spinner size='small' />}
                        {loading ? 'Deleting...' : 'Delete Backup'}
                    </ActionButton>
                </Dialog.Footer>
            </Dialog>
            <SpinnerOverlay fixed visible={loading} />
            {backup.isSuccessful ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <ActionButton
                            className='flex h-8 w-8 items-center justify-center p-0 hover:bg-zinc-700'
                            disabled={loading}
                            size='sm'
                            variant='secondary'
                        >
                            <div>
                                <Bars fill='currentColor' height={22} width={22} />
                            </div>
                        </ActionButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end' className='w-48'>
                        <Can action={'backup.download'}>
                            <DropdownMenuItem className='cursor-pointer' onClick={doDownload}>
                                <ArrowDownToLine className='mr-2' fill='currentColor' height={22} width={22} />
                                Download
                            </DropdownMenuItem>
                        </Can>
                        <Can action={'backup.restore'}>
                            <DropdownMenuItem className='cursor-pointer' onClick={() => setModal('restore')}>
                                <CloudArrowUpIn className='mr-2' fill='currentColor' height={22} width={22} />
                                Restore
                            </DropdownMenuItem>
                        </Can>
                        <Can action={'backup.delete'}>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className='cursor-pointer' onClick={() => setModal('rename')}>
                                <Pencil className='mr-2' fill='currentColor' height={22} width={22} />
                                Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem className='cursor-pointer' onClick={onLockToggle}>
                                <Shield className='mr-2' fill='currentColor' height={22} width={22} />
                                {backup.isLocked ? 'Unlock' : 'Lock'}
                            </DropdownMenuItem>
                            {!backup.isLocked && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className='cursor-pointer text-red-400 focus:text-red-300'
                                        onClick={() => setModal('delete')}
                                    >
                                        <TrashBin className='mr-2' fill='currentColor' height={22} width={22} />
                                        Delete
                                    </DropdownMenuItem>
                                </>
                            )}
                        </Can>
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                <ActionButton
                    className='flex items-center gap-2'
                    disabled={loading}
                    onClick={() => setModal('delete')}
                    size='sm'
                    variant='danger'
                >
                    <TrashBin fill='currentColor' height={22} width={22} />
                    <span className='hidden sm:inline'>Delete</span>
                </ActionButton>
            )}
        </>
    );
};

export default BackupContextMenu;
