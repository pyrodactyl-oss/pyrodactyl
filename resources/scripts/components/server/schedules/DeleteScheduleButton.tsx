import { type Actions, useStoreActions } from 'easy-peasy';
import { useState } from 'react';
import { httpErrorToHuman } from '@/api/http';
import deleteSchedule from '@/api/server/schedules/deleteSchedule';
import ActionButton from '@/components/elements/ActionButton';
import { Dialog } from '@/components/elements/dialog';

import type { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';

interface Props {
    onDeleted: () => void;
    scheduleId: number;
}

const DeleteScheduleButton = ({ scheduleId, onDeleted }: Props) => {
    const [visible, setVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const { addError, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const onDelete = () => {
        setIsLoading(true);
        clearFlashes('schedules');
        deleteSchedule(uuid, scheduleId)
            .then(() => {
                setIsLoading(false);
                onDeleted();
            })
            .catch((error) => {
                console.error(error);

                addError({ key: 'schedules', message: httpErrorToHuman(error) });
                setIsLoading(false);
                setVisible(false);
            });
    };

    return (
        <>
            <Dialog.Confirm
                confirm={'Delete'}
                loading={isLoading}
                onClose={() => setVisible(false)}
                onConfirmed={onDelete}
                open={visible}
                title={'Delete Schedule'}
            >
                All tasks will be removed and any running processes will be terminated.
            </Dialog.Confirm>
            <ActionButton className={'flex-1 sm:flex-none'} onClick={() => setVisible(true)} variant='danger'>
                Delete
            </ActionButton>
        </>
    );
};

export default DeleteScheduleButton;
