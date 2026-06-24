import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { httpErrorToHuman } from '@/api/http';
import getServerSchedules from '@/api/server/schedules/getServerSchedules';
import ActionButton from '@/components/elements/ActionButton';
import Can from '@/components/elements/Can';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import { PageListContainer, PageListItem } from '@/components/elements/pages/PageList';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import FlashMessageRender from '@/components/FlashMessageRender';
import EditScheduleModal from '@/components/server/schedules/EditScheduleModal';
import ScheduleRow from '@/components/server/schedules/ScheduleRow';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';

function ScheduleContainer() {
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const { clearFlashes, addError } = useFlash();
    const [loading, setLoading] = useState(true);
    const [visible, setVisible] = useState(false);

    const schedules = ServerContext.useStoreState((state) => state.schedules.data);
    const setSchedules = ServerContext.useStoreActions((actions) => actions.schedules.setSchedules);

    useEffect(() => {
        clearFlashes('schedules');

        getServerSchedules(uuid)
            .then((schedules) => setSchedules(schedules))
            .catch((error) => {
                addError({ message: httpErrorToHuman(error), key: 'schedules' });
                console.error(error);
            })
            .then(() => setLoading(false));
    }, [uuid, setSchedules, clearFlashes, addError]);

    return (
        <ServerContentBlock title={'Schedules'}>
            <FlashMessageRender byKey={'schedules'} />
            <MainPageHeader
                direction='column'
                title={'Schedules'}
                titleChildren={
                    <Can action={'schedule.create'}>
                        <ActionButton onClick={() => setVisible(true)} variant='primary'>
                            New Schedule
                        </ActionButton>
                    </Can>
                }
            >
                <p className='text-neutral-400 text-sm leading-relaxed'>
                    Automate server tasks with scheduled commands. Create recurring tasks to manage your server, run
                    backups, or execute custom commands.
                </p>
            </MainPageHeader>
            <Can action={'schedule.create'}>
                <EditScheduleModal onModalDismissed={() => setVisible(false)} visible={visible} />
            </Can>
            {!schedules.length && loading ? null : schedules.length === 0 ? (
                <div className='flex min-h-[60vh] flex-col items-center justify-center px-4 py-12'>
                    <div className='text-center'>
                        <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#ffffff11]'>
                            <svg className='h-8 w-8 text-zinc-400' fill='currentColor' viewBox='0 0 20 20'>
                                <path
                                    clipRule='evenodd'
                                    d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z'
                                    fillRule='evenodd'
                                />
                            </svg>
                        </div>
                        <h3 className='mb-2 font-medium text-lg text-zinc-200'>No schedules found</h3>
                        <p className='max-w-sm text-sm text-zinc-400'>
                            Your server does not have any scheduled tasks. Create one to automate server management.
                        </p>
                    </div>
                </div>
            ) : (
                <PageListContainer data-pyro-schedules>
                    {schedules.map((schedule) => (
                        <NavLink end key={schedule.id} to={`${schedule.id}`}>
                            <PageListItem>
                                <ScheduleRow schedule={schedule} />
                            </PageListItem>
                        </NavLink>
                    ))}
                </PageListContainer>
            )}
        </ServerContentBlock>
    );
}

export default ScheduleContainer;
