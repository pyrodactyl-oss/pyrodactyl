import { TrashBin } from '@gravity-ui/icons';
import { useState } from 'react';
import deleteServerAllocation from '@/api/server/network/deleteServerAllocation';
import getServerAllocations from '@/api/swr/getServerAllocations';
import ActionButton from '@/components/elements/ActionButton';
import { Dialog } from '@/components/elements/dialog';
import { useFlashKey } from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';

interface Props {
    allocation: number;
}

const DeleteAllocationButton = ({ allocation }: Props) => {
    const [confirm, setConfirm] = useState(false);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const setServerFromState = ServerContext.useStoreActions((actions) => actions.server.setServerFromState);

    const { mutate } = getServerAllocations();
    const { clearFlashes, clearAndAddHttpError } = useFlashKey('server:network');

    const deleteAllocation = () => {
        clearFlashes();

        setConfirm(false);

        mutate((data) => data?.filter((a) => a.id !== allocation), false);
        setServerFromState((s) => ({
            ...s,
            allocations: s.allocations.filter((a) => a.id !== allocation),
        }));

        deleteServerAllocation(uuid, allocation).catch((error) => {
            clearAndAddHttpError(error);
            mutate();
        });
    };

    return (
        <>
            <Dialog.Confirm
                confirm={'Delete'}
                onClose={() => setConfirm(false)}
                onConfirmed={deleteAllocation}
                open={confirm}
                title={'Remove Allocation'}
            >
                This allocation will be immediately removed from your server.
            </Dialog.Confirm>
            <ActionButton
                className='flex items-center gap-2'
                onClick={() => setConfirm(true)}
                size='sm'
                variant='danger'
            >
                <TrashBin fill='currentColor' height={22} width={22} />
                <span className='hidden sm:inline'>Delete</span>
            </ActionButton>
        </>
    );
};

export default DeleteAllocationButton;
