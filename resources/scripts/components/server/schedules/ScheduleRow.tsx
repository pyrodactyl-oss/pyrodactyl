import { Calendar } from '@gravity-ui/icons';
import { format } from 'date-fns';
import type { Schedule } from '@/api/server/schedules/getServerSchedules';
import ScheduleCronRow from '@/components/server/schedules/ScheduleCronRow';

const ScheduleRow = ({ schedule }: { schedule: Schedule }) => (
    <>
        <div className={'flex-auto'}>
            <div className='flex flex-none flex-row items-center gap-6 align-middle'>
                <Calendar className='flex-none' fill='currentColor' height={25} width={25} />
                <div>
                    <div className='flex flex-row items-center gap-2 text-lg'>
                        <p>{schedule.name}</p>
                    </div>
                    <p className={'text-xs text-zinc-400'}>
                        Last run at: {schedule.lastRunAt ? format(schedule.lastRunAt, "MMM do 'at' h:mma") : 'N/A'}
                    </p>
                </div>
            </div>
        </div>
        <ScheduleCronRow cron={schedule.cron} />
        <div className='flex w-20 flex-none items-center justify-center align-middle sm:ml-2'>
            <p className='rounded-full bg-neutral-600 px-2 py-px text-white text-xs uppercase'>
                {schedule.isProcessing ? 'Processing' : schedule.isActive ? 'Active' : 'Inactive'}
            </p>
        </div>
    </>
);

export default ScheduleRow;
