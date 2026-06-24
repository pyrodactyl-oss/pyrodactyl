import { Form, Formik } from 'formik';
import { useEffect, useState } from 'react';
import updateStartupVariable from '@/api/server/updateStartupVariable';
import ActionButton from '@/components/elements/ActionButton';
import Field from '@/components/elements/Field';
import Modal from '@/components/elements/Modal';
import FlashMessageRender from '@/components/FlashMessageRender';
import { SocketEvent, SocketRequest } from '@/components/server/events';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';

interface Values {
    gslToken: string;
}

const GSLTokenModalFeature = () => {
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { connected, instance } = ServerContext.useStoreState((state) => state.socket);

    useEffect(() => {
        if (!(connected && instance) || status === 'running') return;

        const errors = ['(gsl token expired)', '(account not found)'];

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

    const updateGSLToken = (values: Values) => {
        setLoading(true);
        clearFlashes('feature:gslToken');

        updateStartupVariable(uuid, 'STEAM_ACC', values.gslToken)
            .then(() => {
                if (instance) {
                    instance.send(SocketRequest.SET_STATE, 'restart');
                }

                setLoading(false);
                setVisible(false);
            })
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ key: 'feature:gslToken', error });
            })
            .then(() => setLoading(false));
    };

    useEffect(() => {
        clearFlashes('feature:gslToken');
    }, [clearFlashes]);

    return (
        <Formik initialValues={{ gslToken: '' }} onSubmit={updateGSLToken}>
            <Modal
                closeOnBackground={false}
                onDismissed={() => setVisible(false)}
                showSpinnerOverlay={loading}
                title='Invalid GSL token!'
                visible={visible}
            >
                <FlashMessageRender key={'feature:gslToken'} />
                <Form>
                    <p>It seems like your Gameserver Login Token (GSL token) is invalid or has expired.</p>
                    <p className={'mt-3'}>
                        You can either generate a new one and enter it below or leave the field blank to remove it
                        completely.
                    </p>
                    <div className={'mt-6 items-center sm:flex'}>
                        <Field
                            autoFocus
                            description={'Visit https://steamcommunity.com/dev/managegameservers to generate a token.'}
                            label={'GSL Token'}
                            name={'gslToken'}
                        />
                    </div>
                    <div className={'my-6 items-center justify-end sm:flex'}>
                        <ActionButton type={'submit'} variant='primary'>
                            Update GSL Token
                        </ActionButton>
                    </div>
                </Form>
            </Modal>
        </Formik>
    );
};

export default GSLTokenModalFeature;
