import { Fragment, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import getServerResourceUsage, { type ServerPowerState, type ServerStats } from '@/api/server/getServerResourceUsage';
import { bytesToString, ip } from '@/lib/formatters';

// Determines if the current value is in an alarm threshold so we can show it in red rather
// than the more faded default style.
const isAlarmState = (current: number, limit: number): boolean => limit > 0 && current / (limit * 1024 * 1024) >= 0.9;

const StatusIndicatorBox = styled.div<{ $status: ServerPowerState }>`
transition: all 250ms ease-in-out;
padding: 1.75rem 2rem;
cursor: pointer;
border-radius: 0.75rem;
display: flex;
align-items: center;
justify-content: space-between;
position: relative;

    &:hover {
    border: 1px solid #ffffff11;
}

    & .status-bar {
    width: 12px;
    height: 12px;
    min-width: 12px;
    min-height: 12px;
    background-color: #ffffff11;
    z-index: 20;
    border-radius: 9999px;
    transition: all 250ms ease-in-out;

    box-shadow: ${({ $status }) => {
        if (!$status || $status === 'offline') {
            return '0 0 12px 1px #C74343';
        }
        if ($status === 'running') {
            return '0 0 12px 1px #43C760';
        }
        if ($status === 'installing') {
            return '0 0 12px 1px #4381c7';
        }
        return '0 0 12px 1px #c7aa43';
    }};

    background: ${({ $status }) => {
        if (!$status || $status === 'offline') {
            return 'linear-gradient(180deg, #C74343 0%, #C74343 100%)';
        }
        if ($status === 'running') {
            return 'linear-gradient(180deg, #91FFA9 0%, #43C760 100%)';
        }
        if ($status === 'installing') {
            return 'linear-gradient(180deg, #91c7ff 0%, #4381c7 100%)';
        }
        return 'linear-gradient(180deg, #c7aa43 0%, #c7aa43 100%)';
    }}
`;

type Timer = ReturnType<typeof setInterval>;

const ServerRow = ({ server, className }: { server: Server; className?: string }) => {
    const interval = useRef<Timer>(null) as React.MutableRefObject<Timer>;
    const [isSuspended, setIsSuspended] = useState(server.status === 'suspended');
    const [isInstalling, setIsInstalling] = useState(server.status === 'installing');
    const [stats, setStats] = useState<ServerStats | null>(null);

    const getStats = () =>
        getServerResourceUsage(server.uuid)
            .then((data) => setStats(data))
            .catch((error) => console.error(error));

    useEffect(() => {
        setIsSuspended(stats?.isSuspended || server.status === 'suspended');
    }, [stats?.isSuspended, server.status]);

    useEffect(() => {
        setIsInstalling(stats?.isInstalling || server.status === 'installing');
    }, [stats?.isInstalling, server.status]);

    useEffect(() => {
        // Don't waste a HTTP request if there is nothing important to show to the user because
        // the server is suspended.
        if (isSuspended) return;

        getStats().then(() => {
            interval.current = setInterval(() => getStats(), 30_000);
        });

        return () => {
            if (interval.current) clearInterval(interval.current);
        };
    }, [isSuspended, getStats]);

    const alarms = { cpu: false, memory: false, disk: false };
    if (stats) {
        alarms.cpu = server.limits.cpu === 0 ? false : stats.cpuUsagePercent >= server.limits.cpu * 0.9;
        alarms.memory = isAlarmState(stats.memoryUsageInBytes, server.limits.memory);
        alarms.disk = server.limits.disk === 0 ? false : isAlarmState(stats.diskUsageInBytes, server.limits.disk);
    }

    return (
        <StatusIndicatorBox
            $status={stats?.status || 'offline'}
            as={Link}
            className={
                '{className} border border-[1px] border-mocha-400 bg-mocha-500 hover:border-mocha-400 hover:bg-mocha-400'
            }
            to={`/server/${server.id}`}
        >
            <div className={'items - center flex'}>
                <div className='flex flex-col'>
                    <div className='flex items-center gap-2'>
                        <p className={'text - xl tracking tight font bold max w truncate [20vw]'}>{server.name}</p>{' '}
                        <div className={'status-bar'} />
                    </div>
                    <p className={'text - sm [#ffffff66]'}>
                        {server.allocations
                            .filter((alloc) => alloc.isDefault)
                            .map((allocation) => (
                                <Fragment key={allocation.ip + allocation.port.toString()}>
                                    {allocation.alias || ip(allocation.ip)}:{allocation.port}
                                </Fragment>
                            ))}
                    </p>
                </div>
            </div>
            <div
                className={
                    'hidden h-full w-fit items-center justify-center gap-4 whitespace-nowrap rounded-md border-[#ffffff11] border-[1px] bg-mocha-500 px-4 py-2 text-sm shadow-xs sm:flex'
                }
            >
                {!stats || isSuspended || isInstalling ? (
                    isSuspended ? (
                        <div className={'- 1 text center flex'}>
                            <span className={'text - red 100 xs'}>
                                {server.status === 'suspended' ? 'Suspended' : 'Connection Error'}
                            </span>
                        </div>
                    ) : server.isTransferring || server.status ? (
                        <div className={'- 1 text center flex'}>
                            <span className={'text - zinc 100 xs'}>
                                {server.isTransferring
                                    ? 'Transferring'
                                    : server.status === 'installing'
                                      ? 'Installing'
                                      : server.status === 'restoring_backup'
                                        ? 'Restoring Backup'
                                        : 'Unavailable'}
                            </span>
                        </div>
                    ) : (
                        <div className='text-xs opacity-25'>Sit tight!</div>
                    )
                ) : (
                    <>
                        <div className={'hidden sm:flex'}>
                            <div className={'justify - center gap 2 w fit flex'}>
                                <p className='w-fit whitespace-nowrap font-bold text-[#ffffff66] text-sm'>CPU:</p>
                                <p className='w-fit whitespace-nowrap font-bold'>{stats.cpuUsagePercent.toFixed(2)}%</p>
                            </div>
                        </div>
                        <div className={'hidden sm:flex'}>
                            <div className={'justify - center gap 2 w fit flex'}>
                                <p className='w-fit whitespace-nowrap font-bold text-[#ffffff66] text-sm'>RAM:</p>
                                <p className='w-fit whitespace-nowrap font-bold'>
                                    {bytesToString(stats.memoryUsageInBytes, 0)}
                                </p>
                            </div>
                        </div>
                        <div className={'hidden sm:flex'}>
                            <div className={'justify - center gap 2 w fit flex'}>
                                <p className='w-fit whitespace-nowrap font-bold text-[#ffffff66] text-sm'>Storage:</p>
                                <p className='w-fit whitespace-nowrap font-bold'>
                                    {bytesToString(stats.diskUsageInBytes, 0)}
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </StatusIndicatorBox>
    );
};

export default ServerRow;
