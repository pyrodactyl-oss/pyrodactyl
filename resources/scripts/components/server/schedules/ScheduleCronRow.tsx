import clsx from 'clsx';

import i18n from '@/lib/i18n';
import { Schedule } from '@/api/server/schedules/getServerSchedules';

interface Props {
    cron: Schedule['cron'];
    className?: string;
}

const ScheduleCronRow = ({ cron, className }: Props) => (
    <div className={clsx('flex flex-wrap gap-4 justify-center m-auto', className)}>
        <div className={'text-center'}>
            <p className={'font-medium'}>{cron.minute}</p>
            <p className={'text-xs text-zinc-500 uppercase'}>{i18n.t('server:schedules.minute')}</p>
        </div>
        <div className={'text-center'}>
            <p className={'font-medium'}>{cron.hour}</p>
            <p className={'text-xs text-zinc-500 uppercase'}>{i18n.t('server:schedules.hour')}</p>
        </div>
        <div className={'text-center'}>
            <p className={'font-medium'}>{cron.dayOfMonth}</p>
            <p className={'text-xs text-zinc-500 uppercase'}>{i18n.t('server:schedules.day_of_month')}</p>
        </div>
        <div className={'text-center'}>
            <p className={'font-medium'}>{cron.month}</p>
            <p className={'text-xs text-zinc-500 uppercase'}>{i18n.t('server:schedules.month')}</p>
        </div>
        <div className={'text-center'}>
            <p className={'font-medium'}>{cron.dayOfWeek}</p>
            <p className={'text-xs text-zinc-500 uppercase'}>{i18n.t('server:schedules.day_of_week')}</p>
        </div>
    </div>
);

export default ScheduleCronRow;
