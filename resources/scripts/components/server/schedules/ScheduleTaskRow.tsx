import { CircleQuestion, CloudArrowUpIn, PencilToLine, Power, Terminal, TrashBin } from '@gravity-ui/icons';
import { useState } from 'react';
import { httpErrorToHuman } from '@/api/http';
import deleteScheduleTask from '@/api/server/schedules/deleteScheduleTask';
import type { Schedule, Task } from '@/api/server/schedules/getServerSchedules';
import ActionButton from '@/components/elements/ActionButton';
import Can from '@/components/elements/Can';
import ConfirmationModal from '@/components/elements/ConfirmationModal';
import ItemContainer from '@/components/elements/ItemContainer';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import TaskDetailsModal from '@/components/server/schedules/TaskDetailsModal';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';

interface Props {
    schedule: Schedule;
    task: Task;
}

const getActionDetails = (action: string): [string, any, boolean?] => {
    switch (action) {
        case 'command':
            return ['Send Command', Terminal, true];
        case 'power':
            return ['Send Power Action', Power];
        case 'backup':
            return ['Create Backup', CloudArrowUpIn];
        default:
            return ['Unknown Action', CircleQuestion];
    }
};

const ScheduleTaskRow = ({ schedule, task }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { clearFlashes, addError } = useFlash();
    const [visible, setVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const appendSchedule = ServerContext.useStoreActions((actions) => actions.schedules.appendSchedule);

    const onConfirmDeletion = () => {
        setIsLoading(true);
        clearFlashes('schedules');
        deleteScheduleTask(uuid, schedule.id, task.id)
            .then(() =>
                appendSchedule({
                    ...schedule,
                    tasks: schedule.tasks.filter((t) => t.id !== task.id),
                }),
            )
            .catch((error) => {
                console.error(error);
                setIsLoading(false);
                addError({ message: httpErrorToHuman(error), key: 'schedules' });
            });
    };

    const [title, icon, copyOnClick] = getActionDetails(task.action);

    return (
        <ItemContainer
            copyDescription={copyOnClick}
            description={
                task.payload && task.payload.length > 100 ? `${task.payload.substring(0, 100)}...` : task.payload
            }
            descriptionClasses={'whitespace-nowrap overflow-hidden text-ellipsis'}
            divClasses={'mb-2 gap-6'}
            icon={icon}
            title={title}
        >
            <SpinnerOverlay fixed size={'large'} visible={isLoading} />
            <TaskDetailsModal
                onModalDismissed={() => setIsEditing(false)}
                schedule={schedule}
                task={task}
                visible={isEditing}
            />
            <ConfirmationModal
                buttonText={'Delete Task'}
                onConfirmed={onConfirmDeletion}
                onModalDismissed={() => setVisible(false)}
                title={'Confirm task deletion'}
                visible={visible}
            >
                Are you sure you want to delete this task? This action cannot be undone.
            </ConfirmationModal>
            {/* <FontAwesomeIcon icon={icon} className={`text-lg text-white hidden md:block`} /> */}
            {/* <div className={`flex-none sm:flex-1 w-full sm:w-auto overflow-x-auto`}>
                <p className={`md:ml-6 text-zinc-200 uppercase text-sm`}>{title}</p>
                {task.payload && (
                    <div className={`md:ml-6 mt-2`}>
                        {task.action === 'backup' && (
                            <p className={`text-xs uppercase text-zinc-400 mb-1`}>Ignoring files & folders:</p>
                        )}
                        <div
                            className={`font-mono bg-zinc-800 rounded-sm py-1 px-2 text-sm w-auto inline-block whitespace-pre-wrap break-all`}
                        >
                            {task.payload && task.payload.length > 100
                                ? `${task.payload.substring(0, 100)}...`
                                : task.payload}
                        </div>
                    </div>
                )}
            </div> */}
            <div className={'flex flex-none flex-col items-end gap-2 sm:flex-row sm:items-center'}>
                <div className='mr-0 sm:mr-6'>
                    {task.continueOnFailure && (
                        <div className={'rounded-full bg-yellow-500 px-2 py-1 text-sm text-yellow-800'}>
                            Continues on Failure
                        </div>
                    )}
                    {task.sequenceId > 1 && task.timeOffset > 0 && (
                        <div className={'rounded-full bg-zinc-500 px-2 py-1 text-sm'}>{task.timeOffset}s later</div>
                    )}
                </div>
                <Can action={'schedule.update'}>
                    <ActionButton
                        aria-label='Edit scheduled task'
                        className='ml-auto flex flex-row items-center gap-2 sm:ml-0'
                        onClick={() => setIsEditing(true)}
                        size='sm'
                        variant='secondary'
                    >
                        <PencilToLine fill='currentColor' height={22} width={22} />
                        Edit
                    </ActionButton>
                </Can>
                <Can action={'schedule.update'}>
                    <ActionButton
                        aria-label='Delete scheduled task'
                        className='flex items-center gap-2'
                        onClick={() => setVisible(true)}
                        size='sm'
                        variant='danger'
                    >
                        <TrashBin className='h-4 w-4' fill='currentColor' height={22} width={22} />
                        <span className='hidden sm:inline'>Delete</span>
                    </ActionButton>
                </Can>
            </div>
        </ItemContainer>
    );
};

export default ScheduleTaskRow;
