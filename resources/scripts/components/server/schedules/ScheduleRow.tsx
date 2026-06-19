import { Calendar } from '@gravity-ui/icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import i18n from '@/lib/i18n';

import ScheduleCronRow from '@/components/server/schedules/ScheduleCronRow';

import { Schedule } from '@/api/server/schedules/getServerSchedules';

const ScheduleRow = ({ schedule }: { schedule: Schedule }) => (
    <>
        <div className={`flex-auto`}>
            <div className='flex flex-row flex-none align-middle items-center gap-6'>
                <Calendar width={25} height={25} className='flex-none' fill='currentColor' />
                <div>
                    <div className='flex flex-row items-center gap-2 text-lg'>
                        <p>{schedule.name}</p>
                    </div>
                    <p className={`text-xs text-zinc-400`}>
                        {i18n.t('server:schedules.last_run')}{' '}
                        {schedule.lastRunAt ? format(schedule.lastRunAt, "MMM do 'at' h:mma", { locale: i18n.language === 'es' ? es : undefined }) : i18n.t('server:schedules.not_applicable')}
                    </p>
                </div>
            </div>
        </div>
        <ScheduleCronRow cron={schedule.cron} />
        <div className='flex-none w-20 sm:ml-2 flex items-center align-middle justify-center'>
            <p className='rounded-full px-2 py-px text-xs uppercase bg-neutral-600 text-white'>
                {schedule.isProcessing ? i18n.t('server:schedules.processing') : schedule.isActive ? i18n.t('server:schedules.active_status') : i18n.t('server:schedules.inactive_status')}
            </p>
        </div>
    </>
);

export default ScheduleRow;
