import { cn } from '@/lib/utils';

import { ServerContext } from '@/state/server';

export const StatusPillHeader = () => {
    const status = ServerContext.useStoreState((state) => state.status.value);

    return (
        <div className={cn('relative flex items-center rounded-full transition')}>
            <div
                className={cn(
                    'h-4 w-4 rounded-full transition',
                    status === 'offline' ? 'bg-red-500' : status === 'running' ? 'bg-green-500' : 'bg-yellow-500',
                )}
            />
            <div
                className={cn(
                    'absolute h-4 w-4 animate-ping rounded-full opacity-45 transition',
                    status === 'offline' ? 'hidden' : status === 'running' ? 'bg-green-500' : 'bg-yellow-500',
                )}
            />
            <div className={'hidden font-bold text-sm'}>
                {status === 'offline'
                    ? 'Offline'
                    : status === 'running'
                      ? 'Online'
                      : status === 'stopping'
                        ? 'Stopping'
                        : status === 'starting'
                          ? 'Starting'
                          : 'Fetching'}
            </div>
        </div>
    );
};
