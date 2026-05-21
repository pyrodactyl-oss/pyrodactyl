import { TriangleExclamation } from '@gravity-ui/icons';
import { Actions, useStoreActions } from 'easy-peasy';
import { useEffect, useState } from 'react';

import ActionButton from '@/components/elements/ActionButton';
import { Dialog } from '@/components/elements/dialog';

import { httpErrorToHuman } from '@/api/http';
import reinstallServer from '@/api/server/reinstallServer';

import { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';

/**
 * Reinstall card — danger-zone styled with a clear red border to mark it
 * out from the other settings cards. Reinstall is the only setting on
 * this page that can destroy player data, so it gets its own visual
 * weight and a confirm dialog.
 */
const ReinstallServerBox = () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const { addFlash, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const reinstall = () => {
        setLoading(true);
        clearFlashes('settings');
        reinstallServer(uuid)
            .then(() => {
                addFlash({
                    key: 'settings',
                    type: 'success',
                    message: 'Your server has begun the reinstallation process.',
                });
            })
            .catch((error) => {
                console.error(error);
                addFlash({ key: 'settings', type: 'error', message: httpErrorToHuman(error) });
            })
            .then(() => {
                setLoading(false);
                setModalVisible(false);
            });
    };

    useEffect(() => {
        clearFlashes();
    }, []);

    return (
        <section className='rounded-2xl border border-red-500/30 bg-red-500/[0.04] transition hover:duration-0 hover:border-red-500/50 hover:bg-red-500/[0.07]'>
            <header className='flex items-center gap-2 border-b border-red-500/20 px-5 py-3.5'>
                <TriangleExclamation width={16} height={16} className='text-red-400' />
                <h2 className='text-sm font-semibold text-red-200'>Reinstall Server</h2>
            </header>
            <Dialog.Confirm
                open={modalVisible}
                title='Confirm server reinstallation'
                confirm='Yes, reinstall server'
                onClose={() => setModalVisible(false)}
                onConfirmed={reinstall}
                loading={loading}
            >
                Your server will be stopped and some files may be deleted or modified during this
                process, are you sure you wish to continue?
            </Dialog.Confirm>
            <div className='flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between'>
                <p className='text-xs text-zinc-300'>
                    Re-runs the installation script that initially set this server up. Existing files may be
                    deleted or modified — back up your data first.
                </p>
                <ActionButton variant='danger' size='sm' onClick={() => setModalVisible(true)}>
                    Reinstall Server
                </ActionButton>
            </div>
        </section>
    );
};

export default ReinstallServerBox;
