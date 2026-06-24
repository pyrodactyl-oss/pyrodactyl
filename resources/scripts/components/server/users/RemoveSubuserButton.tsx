import { TrashBin } from '@gravity-ui/icons';
import { type Actions, useStoreActions } from 'easy-peasy';
import { useState } from 'react';
import { httpErrorToHuman } from '@/api/http';
import deleteSubuser from '@/api/server/users/deleteSubuser';
import ActionButton from '@/components/elements/ActionButton';
import ConfirmationModal from '@/components/elements/ConfirmationModal';

import type { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';
import type { Subuser } from '@/state/server/subusers';

const RemoveSubuserButton = ({ subuser }: { subuser: Subuser }) => {
    const [loading, setLoading] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const removeSubuser = ServerContext.useStoreActions((actions) => actions.subusers.removeSubuser);
    const { addError, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const doDeletion = () => {
        setLoading(true);
        clearFlashes('users');
        deleteSubuser(uuid, subuser.uuid)
            .then(() => {
                setLoading(false);
                removeSubuser(subuser.uuid);
                setShowConfirmation(false);
            })
            .catch((error) => {
                console.error(error);
                addError({ key: 'users', message: httpErrorToHuman(error) });
                setShowConfirmation(false);
            });
    };

    return (
        <>
            <ConfirmationModal
                buttonText={`Remove ${subuser.username}`}
                loading={loading}
                onConfirmed={() => doDeletion()}
                onModalDismissed={() => setShowConfirmation(false)}
                title={`Remove ${subuser.username}?`}
                visible={showConfirmation}
            >
                All access to the server will be removed immediately.
            </ConfirmationModal>
            <ActionButton
                aria-label='Delete subuser'
                className='flex items-center gap-2'
                onClick={() => setShowConfirmation(true)}
                size='sm'
                variant='danger'
            >
                <TrashBin className='h-4 w-4' fill='currentColor' height={22} width={22} />
                Delete
            </ActionButton>
        </>
    );
};

export default RemoveSubuserButton;
