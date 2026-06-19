import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';

import { Dialog } from '@/components/elements/dialog';

import { deleteSSHKey, useSSHKeys } from '@/api/account/ssh-keys';

import i18n from '@/lib/i18n';

import { useFlashKey } from '@/plugins/useFlash';

const DeleteSSHKeyButton = ({ name, fingerprint }: { name: string; fingerprint: string }) => {
    const { clearAndAddHttpError } = useFlashKey('ssh-keys');
    const [visible, setVisible] = useState(false);
    const { mutate } = useSSHKeys();

    const onClick = () => {
        clearAndAddHttpError();

        Promise.all([
            mutate((data) => data?.filter((value) => value.fingerprint !== fingerprint), false),
            deleteSSHKey(fingerprint),
        ]).catch((error) => {
            mutate(undefined, true).catch(console.error);
            clearAndAddHttpError(error);
        });
    };

    return (
        <>
            <Dialog.Confirm
                open={visible}
                title={i18n.t('dashboard:ssh_keys.delete_title')}
                confirm={i18n.t('dashboard:ssh_keys.delete_confirm')}
                onConfirmed={onClick}
                onClose={() => setVisible(false)}
            >
                {i18n.t('dashboard:ssh_keys.delete_warning', { name })}
            </Dialog.Confirm>
            <button
                className='p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-150'
                onClick={() => setVisible(true)}
            >
                <FontAwesomeIcon icon={faTrashAlt} size='lg' />
            </button>
        </>
    );
};

export default DeleteSSHKeyButton;
