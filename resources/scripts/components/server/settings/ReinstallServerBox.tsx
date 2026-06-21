import { Actions, useStoreActions } from 'easy-peasy';
import { useEffect, useState } from 'react';

import ActionButton from '@/components/elements/ActionButton';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import { Dialog } from '@/components/elements/dialog';

import i18n from '@/lib/i18n';

import { httpErrorToHuman } from '@/api/http';
import reinstallServer from '@/api/server/reinstallServer';

import { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';

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
                    message: i18n.t('server:settings.reinstalled'),
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
        <TitledGreyBox title={i18n.t('server:settings.reinstall_title')}>
            <Dialog.Confirm
                open={modalVisible}
                title={i18n.t('server:settings.reinstall_confirm_title')}
                confirm={i18n.t('server:settings.reinstall_confirm_button')}
                onClose={() => setModalVisible(false)}
                onConfirmed={reinstall}
                loading={loading}
            >
                {i18n.t('server:settings.reinstall_message')}
            </Dialog.Confirm>
            <p className={`text-sm`}>{i18n.t('server:settings.reinstall_description')}</p>
            <div className={`mt-6 text-right`}>
                <ActionButton variant='danger' onClick={() => setModalVisible(true)}>
                    {i18n.t('server:settings.reinstall_button')}
                </ActionButton>
            </div>
        </TitledGreyBox>
    );
};

export default ReinstallServerBox;
