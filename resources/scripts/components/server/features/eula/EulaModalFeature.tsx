import { useEffect, useState } from 'react';
import saveFileContents from '@/api/server/files/saveFileContents';
import ActionButton from '@/components/elements/ActionButton';
import Modal from '@/components/elements/Modal';
import FlashMessageRender from '@/components/FlashMessageRender';
import { SocketEvent, SocketRequest } from '@/components/server/events';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';

const EulaModalFeature = () => {
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { connected, instance } = ServerContext.useStoreState((state) => state.socket);

    useEffect(() => {
        if (!(connected && instance) || status === 'running') return;

        const listener = (line: string) => {
            if (line.toLowerCase().indexOf('you need to agree to the eula in order to run the server') >= 0) {
                setVisible(true);
            }
        };

        instance.addListener(SocketEvent.CONSOLE_OUTPUT, listener);

        return () => {
            instance.removeListener(SocketEvent.CONSOLE_OUTPUT, listener);
        };
    }, [connected, instance, status]);

    const onAcceptEULA = () => {
        setLoading(true);
        clearFlashes('feature:eula');

        saveFileContents(uuid, 'eula.txt', 'eula=true')
            .then(() => {
                if (status === 'offline' && instance) {
                    instance.send(SocketRequest.SET_STATE, 'restart');
                }

                setLoading(false);
                setVisible(false);
            })
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ key: 'feature:eula', error });
            })
            .then(() => setLoading(false));
    };

    useEffect(() => {
        clearFlashes('feature:eula');
    }, []);

    return (
        <Modal
            closeOnBackground={false}
            onDismissed={() => setVisible(false)}
            showSpinnerOverlay={loading}
            title='Accept Minecraft EULA'
            visible={visible}
        >
            <div className='flex flex-col'>
                <FlashMessageRender key={'feature:eula'} />
                <p className={'text-zinc-200'}>
                    Before starting your Minecraft server, you need to accept the{' '}
                    <a
                        className={'text-zinc-300 underline transition-colors duration-150 hover:text-zinc-400'}
                        href='https://www.aka.ms/MinecraftEULA'
                        rel={'noreferrer noopener'}
                        target={'_blank'}
                    >
                        Minecraft EULA
                    </a>
                    .
                </p>
                <div className={'my-6 flex items-center justify-end gap-3'}>
                    <ActionButton onClick={() => setVisible(false)} variant='secondary'>
                        I don&apos;t accept
                    </ActionButton>
                    <ActionButton onClick={onAcceptEULA} variant='primary'>
                        I accept
                    </ActionButton>
                </div>
            </div>
        </Modal>
    );
};

export default EulaModalFeature;
