import type { ActivityLog } from '@definitions/user';
import { TerminalLine } from '@gravity-ui/icons';
// FIXME: replace with radix tooltip
// import Tooltip from '@/components/elements/tooltip/Tooltip';
import { formatDistanceToNowStrict } from 'date-fns';
import { Link } from 'react-router-dom';

import ActivityLogMetaButton from '@/components/elements/activity/ActivityLogMetaButton';

import { formatObjectToIdentString } from '@/lib/objects';

import useLocationHash from '@/plugins/useLocationHash';

interface Props {
    activity: ActivityLog;
    children?: React.ReactNode;
}

const ActivityLogEntry = ({ activity, children }: Props) => {
    const { pathTo } = useLocationHash();
    const actor = activity.relationships.actor;

    return (
        <div className='group flex items-center border-zinc-800/30 border-b px-3 py-2 transition-colors duration-150 last:border-0 hover:bg-zinc-800/20'>
            {/* Compact Avatar */}
            <div className='mr-3 h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-zinc-600'>
                {actor?.image ? (
                    <img alt={actor.username || 'System'} className='h-full w-full object-cover' src={actor.image} />
                ) : (
                    <div className='flex h-full w-full items-center justify-center font-semibold text-xs text-zinc-300'>
                        {(actor?.username || 'S').charAt(0).toUpperCase()}
                    </div>
                )}
            </div>

            {/* Main Content - Compact Layout */}
            <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-2 text-sm'>
                    <span className='truncate font-medium text-zinc-100'>{actor?.username || 'System'}</span>
                    <span className='text-zinc-500'>•</span>
                    <Link
                        className='truncate rounded bg-zinc-800/50 px-2 py-1 font-mono text-xs text-zinc-300 transition-colors duration-150 hover:bg-zinc-700/50 hover:text-brand'
                        to={`#${pathTo({ event: activity.event })}`}
                    >
                        {activity.event}
                    </Link>

                    {/* Compact badges */}
                    <div className='ml-auto flex items-center gap-1'>
                        {activity.isApi && (
                            <span className='flex items-center gap-1 rounded bg-blue-900/30 px-1.5 py-0.5 text-blue-300 text-xs'>
                                <TerminalLine fill='currentColor' height={22} width={22} />
                                API
                            </span>
                        )}
                        {children}
                    </div>
                </div>

                {/* Compact metadata and timestamp */}
                <div className='mt-1 flex items-center gap-3 text-xs text-zinc-400'>
                    {activity.ip && (
                        <span className='rounded bg-zinc-800/30 px-1.5 py-0.5 font-mono'>{activity.ip}</span>
                    )}
                    <span>{formatDistanceToNowStrict(activity.timestamp, { addSuffix: true })}</span>

                    {/* Inline properties for compact view */}
                    {!activity.hasAdditionalMetadata &&
                        activity.properties &&
                        Object.keys(activity.properties).length > 0 && (
                            <span className='max-w-xs truncate text-zinc-500'>
                                {formatObjectToIdentString(activity.properties)}
                            </span>
                        )}
                </div>
            </div>

            {/* Metadata button */}
            {activity.hasAdditionalMetadata && (
                <div className='ml-2 flex-shrink-0'>
                    <ActivityLogMetaButton meta={activity.properties} />
                </div>
            )}
        </div>
    );
};

export default ActivityLogEntry;
