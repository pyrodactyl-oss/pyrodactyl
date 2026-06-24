import { useEffect, useState } from 'react';
import Button from '@/components/elements/ActionButton';
// assuming this is your styled button
import Modal from '@/components/elements/Modal';
import FlashMessageRender from '@/components/FlashMessageRender';
import { SocketEvent } from '@/components/server/events';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';

const HytaleOauthRequireFeature = () => {
    const [visible, setVisible] = useState(false);
    const [userCode, setUserCode] = useState('');
    const [verificationUri, setVerificationUri] = useState('');

    const status = ServerContext.useStoreState((state) => state.status.value);
    const { clearFlashes } = useFlash();
    const { connected, instance } = ServerContext.useStoreState((state) => state.socket);

    useEffect(() => {
        if (!(connected && instance) || status === 'running') return;

        const listener = (line: string) => {
            const urlMatch = line.match(
                /https:\/\/oauth\.accounts\.hytale\.com\/oauth2\/device\/verify\?user_code=([a-zA-Z0-9\s]+)/i,
            );
            if (urlMatch) {
                const code = urlMatch[1]?.trim() || '';
                setUserCode(code);
                setVerificationUri(urlMatch[0] || '');
                setVisible(true);
                return;
            }
        };

        instance.addListener(SocketEvent.CONSOLE_OUTPUT, listener);
        return () => {
            instance.removeListener(SocketEvent.CONSOLE_OUTPUT, listener);
        };
    }, [connected, instance, status]);

    useEffect(() => {
        clearFlashes('feature:hytaleOauth');
    }, []);

    const handleAuthenticate = () => {
        if (verificationUri) {
            window.open(verificationUri, '_blank', 'noopener,noreferrer');
            setVisible(false);
        }
    };

    return (
        <Modal
            closeOnBackground={false}
            onDismissed={() => {
                setVisible(false);
                setUserCode('');
                setVerificationUri('');
            }}
            showSpinnerOverlay={false}
            title='Hytale Authentication'
            visible={visible}
        >
            <FlashMessageRender key='feature:hytaleOauth' />
            <div>
                <div className='mb-6 text-center text-zinc-300'>
                    <p className='mb-4 text-md'>
                        Server requires authentication to start. Click below to verify this device.
                    </p>
                </div>

                <Button
                    className='mb-6 flex w-full items-center justify-center gap-2 rounded bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700'
                    onClick={handleAuthenticate}
                    variant='primary'
                >
                    Authenticate Server
                </Button>
                <div className='relative my-6'>
                    <div className='absolute inset-0 flex items-center'>
                        <div className='h-px w-full bg-[#ffffff33]' />
                    </div>

                    <div className='relative flex justify-center text-sm text-zinc-400 uppercase tracking-wider'>
                        <span className='bg-zinc-900 px-5'>OR ENTER CODE MANUALLY</span>
                    </div>
                </div>

                <div className='rounded border border-zinc-700 bg-zinc-900 p-4 text-center'>
                    <div className='mb-2 text-sm text-zinc-400'>DEVICE CODE</div>
                    {userCode ? (
                        <div
                            className='mb-2 cursor-pointer font-mono text-3xl text-white tracking-wider transition-colors hover:text-zinc-300'
                            onClick={() => navigator.clipboard.writeText(userCode)}
                        >
                            {userCode}
                        </div>
                    ) : (
                        <div className='mb-2 font-mono text-3xl text-white tracking-wider'>•••• ••••</div>
                    )}
                </div>

                <p className='mt-4 text-center text-xs text-zinc-500'>Only required once per server</p>
            </div>
        </Modal>
    );
};

export default HytaleOauthRequireFeature;
