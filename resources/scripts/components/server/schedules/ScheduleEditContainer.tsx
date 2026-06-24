import { format } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';
import isEqual from 'react-fast-compare';
import { useNavigate, useParams } from 'react-router-dom';
import getServerSchedule from '@/api/server/schedules/getServerSchedule';
import triggerScheduleExecution from '@/api/server/schedules/triggerScheduleExecution';
import ActionButton from '@/components/elements/ActionButton';
import Can from '@/components/elements/Can';
import ItemContainer from '@/components/elements/ItemContainer';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Spinner from '@/components/elements/Spinner';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import FlashMessageRender from '@/components/FlashMessageRender';
import DeleteScheduleButton from '@/components/server/schedules/DeleteScheduleButton';
import EditScheduleModal from '@/components/server/schedules/EditScheduleModal';
import ScheduleTaskRow from '@/components/server/schedules/ScheduleTaskRow';
import TaskDetailsModal from '@/components/server/schedules/TaskDetailsModal';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';

const CronBox = ({ title, value }: { title: string; value: string }) => (
    <ItemContainer description={value} title={title} />
);

const ActivePill = ({ active }: { active: boolean }) => (
    <span className='ml-4 flex items-center rounded-full bg-neutral-600 px-2 py-px text-white text-xs uppercase'>
        {active ? 'Active' : 'Inactive'}
    </span>
);

const ScheduleEditContainer = () => {
    const { id: scheduleId } = useParams<'id'>();
    const navigate = useNavigate();

    const id = ServerContext.useStoreState((state) => state.server.data?.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);

    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const [isLoading, setIsLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [runLoading, setRunLoading] = useState(false);

    const schedule = ServerContext.useStoreState(
        (st) => st.schedules.data.find((s) => s.id === Number(scheduleId)),
        isEqual,
    );
    const appendSchedule = ServerContext.useStoreActions((actions) => actions.schedules.appendSchedule);

    useEffect(() => {
        if (schedule?.id === Number(scheduleId)) {
            setIsLoading(false);
            return;
        }

        clearFlashes('schedules');
        getServerSchedule(uuid, Number(scheduleId))
            .then((schedule) => appendSchedule(schedule))
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ error, key: 'schedules' });
            })
            .then(() => setIsLoading(false));
    }, [scheduleId, clearAndAddHttpError, uuid, schedule?.id, clearFlashes, appendSchedule]);

    const toggleEditModal = useCallback(() => {
        setShowEditModal((s) => !s);
    }, []);

    const onTriggerExecute = useCallback(() => {
        clearFlashes('schedule');
        setRunLoading(true);
        triggerScheduleExecution(id, schedule?.id)
            .then(() => {
                setRunLoading(false);
                appendSchedule({ ...schedule!, isProcessing: true });
            })
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ error, key: 'schedules' });
            })
            .then(() => setRunLoading(false));
    }, [schedule, id, clearFlashes, clearAndAddHttpError, appendSchedule]);

    return (
        <PageContentBlock title={'Schedules'}>
            <FlashMessageRender byKey={'schedules'} />
            {!schedule || isLoading ? (
                <Spinner centered size={'large'} />
            ) : (
                <div className={'flex flex-col gap-6 rounded-sm shadow-sm'}>
                    <div
                        className={
                            'flex flex-col place-content-between items-center gap-6 overflow-hidden rounded-2xl border-[#ffffff11] border-[1px] bg-[#ffffff09] p-6 md:flex-row'
                        }
                    >
                        <div className={'flex-none self-start'}>
                            <h3 className={'flex items-center text-2xl text-neutral-100'}>
                                {schedule.name}
                                {schedule.isProcessing ? (
                                    <span
                                        className={
                                            'ml-4 flex items-center rounded-full bg-neutral-600 px-2 py-px text-white text-xs uppercase'
                                        }
                                    >
                                        Processing
                                    </span>
                                ) : (
                                    <ActivePill active={schedule.isActive} />
                                )}
                            </h3>
                            <p className={'mt-1 text-sm'}>
                                <strong>Last run at:&nbsp;</strong>
                                {schedule.lastRunAt ? (
                                    format(schedule.lastRunAt, "MMM do 'at' h:mma")
                                ) : (
                                    <span>N/A</span>
                                )}

                                <span className={'ml-4 hidden border-neutral-600 border-l-4 py-px pl-4 sm:inline'} />
                                <br className={'sm:hidden'} />

                                <strong>Next run at:&nbsp;</strong>
                                {schedule.nextRunAt ? (
                                    format(schedule.nextRunAt, "MMM do 'at' h:mma")
                                ) : (
                                    <span>N/A</span>
                                )}
                            </p>
                        </div>
                        <div className={'flex min-w-full flex-col gap-2 md:min-w-0 md:flex-row'}>
                            <Can action={'schedule.update'}>
                                <ActionButton
                                    className={'min-w-max flex-1'}
                                    onClick={toggleEditModal}
                                    variant='secondary'
                                >
                                    Edit
                                </ActionButton>
                                <ActionButton
                                    className={'min-w-max flex-1'}
                                    onClick={() => setShowTaskModal(true)}
                                    variant='primary'
                                >
                                    New Task
                                </ActionButton>
                            </Can>
                        </div>
                    </div>
                    <div className={'grid grid-cols-3 gap-4 sm:grid-cols-5'}>
                        <CronBox title={'Minute'} value={schedule.cron.minute} />
                        <CronBox title={'Hour'} value={schedule.cron.hour} />
                        <CronBox title={'Day (Month)'} value={schedule.cron.dayOfMonth} />
                        <CronBox title={'Month'} value={schedule.cron.month} />
                        <CronBox title={'Day (Week)'} value={schedule.cron.dayOfWeek} />
                    </div>
                    <div>
                        {schedule.tasks.length > 0
                            ? schedule.tasks
                                  .sort((a, b) =>
                                      a.sequenceId === b.sequenceId ? 0 : a.sequenceId > b.sequenceId ? 1 : -1,
                                  )
                                  .map((task) => (
                                      <ScheduleTaskRow
                                          key={`${schedule.id}_${task.id}`}
                                          schedule={schedule}
                                          task={task}
                                      />
                                  ))
                            : null}
                    </div>
                    <EditScheduleModal onModalDismissed={toggleEditModal} schedule={schedule} visible={showEditModal} />
                    <div className={'flex gap-3 sm:justify-end'}>
                        <Can action={'schedule.delete'}>
                            <DeleteScheduleButton
                                onDeleted={() => navigate(`/server/${id}/schedules`)}
                                scheduleId={schedule.id}
                            />
                        </Can>
                        {schedule.tasks.length > 0 && (
                            <Can action={'schedule.update'}>
                                <SpinnerOverlay size={'large'} visible={runLoading} />
                                <ActionButton
                                    className={'flex-1 sm:flex-none'}
                                    disabled={schedule.isProcessing}
                                    onClick={onTriggerExecute}
                                    variant='secondary'
                                >
                                    Run Now
                                </ActionButton>
                            </Can>
                        )}
                    </div>
                    <TaskDetailsModal
                        onModalDismissed={() => setShowTaskModal(false)}
                        schedule={schedule}
                        visible={showTaskModal}
                    />
                </div>
            )}
        </PageContentBlock>
    );
};

export default ScheduleEditContainer;
