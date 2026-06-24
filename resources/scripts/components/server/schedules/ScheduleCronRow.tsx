import clsx from 'clsx';

import type { Schedule } from '@/api/server/schedules/getServerSchedules';

interface Props {
    className?: string;
    cron: Schedule['cron'];
}

const ScheduleCronRow = ({ cron, className }: Props) => (
    <div className={clsx('m-auto flex flex-wrap justify-center gap-4', className)}>
        <div className={'text-center'}>
            <p className={'font-medium'}>{cron.minute}</p>
            <p className={'text-xs text-zinc-500 uppercase'}>Minute</p>
        </div>
        <div className={'text-center'}>
            <p className={'font-medium'}>{cron.hour}</p>
            <p className={'text-xs text-zinc-500 uppercase'}>Hour</p>
        </div>
        <div className={'text-center'}>
            <p className={'font-medium'}>{cron.dayOfMonth}</p>
            <p className={'text-xs text-zinc-500 uppercase'}>Day (Month)</p>
        </div>
        <div className={'text-center'}>
            <p className={'font-medium'}>{cron.month}</p>
            <p className={'text-xs text-zinc-500 uppercase'}>Month</p>
        </div>
        <div className={'text-center'}>
            <p className={'font-medium'}>{cron.dayOfWeek}</p>
            <p className={'text-xs text-zinc-500 uppercase'}>Day (Week)</p>
        </div>
    </div>
);

export default ScheduleCronRow;
