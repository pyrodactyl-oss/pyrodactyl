import clsx from 'clsx';

import i18n from '@/lib/i18n';

import { ServerContext } from '@/state/server';

export const StatusPill = () => {
    const status = ServerContext.useStoreState((state) => state.status.value);

    return (
        <div
            className={clsx(
                'relative transition rounded-full pl-3 pr-3 py-2 flex items-center gap-1',
                status === 'offline' ? 'bg-red-400/25' : status === 'running' ? 'bg-green-400/25' : 'bg-yellow-400/25',
            )}
        >
            <div
                className={clsx(
                    'transition rounded-full h-4 w-4',
                    status === 'offline' ? 'bg-red-500' : status === 'running' ? 'bg-green-500' : 'bg-yellow-500',
                )}
            ></div>
            <div
                className={clsx(
                    'transition rounded-full h-4 w-4 animate-ping absolute top-2.5 opacity-45',
                    status === 'offline' ? 'bg-red-500' : status === 'running' ? 'bg-green-500' : 'bg-yellow-500',
                )}
            ></div>
            <div className='text-sm font-bold'>
                {status === 'offline'
                    ? i18n.t('server:details.offline')
                    : status === 'running'
                      ? i18n.t('server:details.online')
                      : status === 'stopping'
                        ? i18n.t('server:details.stopping')
                        : status === 'starting'
                          ? i18n.t('server:details.starting')
                          : i18n.t('server:details.fetching')}
            </div>
        </div>
    );
};
