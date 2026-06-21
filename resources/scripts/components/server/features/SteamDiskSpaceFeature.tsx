import { useStoreState } from 'easy-peasy';
import { useEffect, useState } from 'react';

import FlashMessageRender from '@/components/FlashMessageRender';
import Modal from '@/components/elements/Modal';
import { SocketEvent } from '@/components/server/events';

import i18n from '@/lib/i18n';

import { ServerContext } from '@/state/server';

import useFlash from '@/plugins/useFlash';

const SteamDiskSpaceFeature = () => {
    const [visible, setVisible] = useState(false);
    const [loading] = useState(false);

    const status = ServerContext.useStoreState((state) => state.status.value);
    const { clearFlashes } = useFlash();
    const { connected, instance } = ServerContext.useStoreState((state) => state.socket);
    const isAdmin = useStoreState((state) => state.user.data!.rootAdmin);

    useEffect(() => {
        if (!connected || !instance || status === 'running') return;

        const errors = ['steamcmd needs 250mb of free disk space to update', '0x202 after update job'];

        const listener = (line: string) => {
            if (errors.some((p) => line.toLowerCase().includes(p))) {
                setVisible(true);
            }
        };

        instance.addListener(SocketEvent.CONSOLE_OUTPUT, listener);

        return () => {
            instance.removeListener(SocketEvent.CONSOLE_OUTPUT, listener);
        };
    }, [connected, instance, status]);

    useEffect(() => {
        clearFlashes('feature:steamDiskSpace');
    }, []);

    return (
        <Modal
            visible={visible}
            onDismissed={() => setVisible(false)}
            showSpinnerOverlay={loading}
            dismissable={false}
            closeOnBackground={false}
            closeButton={true}
            title={i18n.t('server:features.steam_disk.title')}
        >
            <FlashMessageRender key={'feature:steamDiskSpace'} />
            <div className={`flex-col`}>
                {isAdmin ? (
                    <>
                        <p>{i18n.t('server:features.steam_disk.admin_description')}</p>
                        <p className='mt-3'>
                            {i18n.t('server:features.steam_disk.admin_instructions', {
                                // Preserve the original instruction text which references df -h
                                interpolation: { escapeValue: false },
                            })}
                        </p>
                    </>
                ) : (
                    <>
                        <p className={`mt-4`}>{i18n.t('server:features.steam_disk.user_description')}</p>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default SteamDiskSpaceFeature;
