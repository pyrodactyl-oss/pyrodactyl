import { Fragment, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { bytesToString, ip } from '@/lib/formatters';

import { Server } from '@/api/server/getServer';
import getServerResourceUsage, { ServerPowerState, ServerStats } from '@/api/server/getServerResourceUsage';

// If you already have a power helper, import it and remove the fallback below:
// import { sendPowerSignal } from '@/api/server/power';

// Minimal fallback helper (replace with your real one)
async function sendPowerSignal(uuid: string, signal: 'start' | 'stop' | 'restart' | 'kill') {
    const res = await fetch(`/api/client/servers/${uuid}/power`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signal }),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Power action failed: ${res.status} ${text}`);
    }
}

// Determines if the current value is in an alarm threshold so we can show it in red rather
// than the more faded default style.
const isAlarmState = (current: number, limit: number): boolean => limit > 0 && current / (limit * 1024 * 1024) >= 0.9;

const StatusIndicatorBox = styled.div<{ $status: ServerPowerState | undefined }>`
    background: #ffffff11;
    border: 1px solid #ffffff12;
    transition: all 250ms ease-in-out;
    padding: 1.75rem 2rem;
    cursor: pointer;
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;

    &:hover {
        border: 1px solid #ffffff19;
        background: #ffffff19;
        transition-duration: 0ms;
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

        box-shadow: ${({ $status }) =>
            !$status || $status === 'offline'
                ? '0 0 12px 1px #C74343'
                : $status === 'running'
                  ? '0 0 12px 1px #43C760'
                  : '0 0 12px 1px #c7aa43'};

        background: ${({ $status }) =>
            !$status || $status === 'offline'
                ? `linear-gradient(180deg, #C74343 0%, #C74343 100%)`
                : $status === 'running'
                  ? `linear-gradient(180deg, #91FFA9 0%, #43C760 100%)`
                  : `linear-gradient(180deg, #c7aa43 0%, #c7aa43 100%)`};
    }
`;

type Timer = ReturnType<typeof setInterval>;

const ServerRow = ({
    server,
    className,
    isEditMode = false,
}: {
    server: Server;
    className?: string;
    isEditMode?: boolean;
}) => {
    const interval = useRef<Timer>(null) as React.MutableRefObject<Timer>;
    const [isSuspended, setIsSuspended] = useState(server.status === 'suspended');
    const [stats, setStats] = useState<ServerStats | null>(null);

    const [copied, setCopied] = useState(false);
    const [isStarting, setIsStarting] = useState(false);

    const getStats = () =>
        getServerResourceUsage(server.uuid)
            .then((data) => setStats(data))
            .catch((error) => console.error(error));

    useEffect(() => {
        setIsSuspended(stats?.isSuspended || server.status === 'suspended');
    }, [stats?.isSuspended, server.status]);

    useEffect(() => {
        if (isSuspended) return;

        getStats().then(() => {
            interval.current = setInterval(() => getStats(), 30000);
        });

        return () => {
            if (interval.current) clearInterval(interval.current);
        };
    }, [isSuspended]);

    const alarms = { cpu: false, memory: false, disk: false };
    if (stats) {
        alarms.cpu = server.limits.cpu === 0 ? false : stats.cpuUsagePercent >= server.limits.cpu * 0.9;
        alarms.memory = isAlarmState(stats.memoryUsageInBytes, server.limits.memory);
        alarms.disk = server.limits.disk === 0 ? false : isAlarmState(stats.diskUsageInBytes, server.limits.disk);
    }

    // Build default allocation string (ip:port)
    const defaultAllocation = server.allocations.find((alloc) => alloc.isDefault);
    const allocationText = defaultAllocation
        ? `${defaultAllocation.alias || ip(defaultAllocation.ip)}:${defaultAllocation.port}`
        : '';

    const handleCopyAllocation = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (!allocationText) return;

        try {
            await navigator.clipboard.writeText(allocationText);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } catch (err) {
            console.error('Failed to copy allocation to clipboard', err);
        }
    };

    // Determine offline
    const isOffline =
        (stats?.status && stats.status === 'offline') ||
        (!stats && (server.status === 'offline' || server.status === null));

    const handleStart = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (isStarting) return;

        try {
            setIsStarting(true);
            await sendPowerSignal(server.uuid, 'start');
            // Optimistic refresh
            setTimeout(() => {
                getStats().catch(() => undefined);
            }, 1000);
        } catch (err) {
            console.error('Failed to start server:', err);
        } finally {
            setIsStarting(false);
        }
    };

    // Shared card styles: keep width consistent
    // We emulate the width resources would take with a min-width.
    // Adjust minWidth if your design differs.
    const cardClass =
        'h-full hidden sm:flex items-center justify-between border-[1px] border-[#ffffff12] shadow-md rounded-lg w-fit whitespace-nowrap px-4 py-2 text-sm gap-4';
    const cardStyle = {
        background: 'radial-gradient(124.75% 124.75% at 50.01% -10.55%, rgb(36, 36, 36) 0%, rgb(20, 20, 20) 100%)',
        minWidth: '360px', // ensure same width as the three-metric layout
    } as const;

    return (
        <StatusIndicatorBox
            as={Link}
            to={`/server/${server.id}`}
            className={className}
            $status={stats?.status}
            style={isEditMode ? { pointerEvents: 'none' } : undefined}
        >
            <div className='flex items-center'>
                <div className='flex flex-col'>
                    <div className='flex items-center gap-2'>
                        <p className='text-xl tracking-tight font-bold break-words'>{server.name}</p>
                        <div className='status-bar' />
                    </div>

                    {defaultAllocation && (
                        <div className='mt-1 flex items-center gap-2 text-sm text-[#ffffff66]'>
                            <span>
                                {defaultAllocation.alias || ip(defaultAllocation.ip)}:{defaultAllocation.port}
                            </span>

                            <button
                                onClick={handleCopyAllocation}
                                className='inline-flex items-center justify-center rounded-md text-[#ffffff66] hover:text-[#ffffffaa] hover:bg-white/5 transition-colors p-1'
                                aria-label='Copy server address'
                            >
                                <svg
                                    xmlns='http://www.w3.org/2000/svg'
                                    width='13'
                                    height='13'
                                    viewBox='0 0 16 16'
                                    fill='none'
                                >
                                    <path
                                        d='M5 3.5C5 2.39543 5.89543 1.5 7 1.5H12C13.1046 1.5 14 2.39543 14 3.5V8.5C14 9.60457 13.1046 10.5 12 10.5H7C5.89543 10.5 5 9.60457 5 8.5V3.5Z'
                                        stroke='currentColor'
                                        strokeWidth='1.2'
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                    />
                                    <path
                                        d='M3 5.5C2.44772 5.5 2 5.94772 2 6.5V11.5C2 12.6046 2.89543 13.5 4 13.5H9C9.55228 13.5 10 13.0523 10 12.5'
                                        stroke='currentColor'
                                        strokeWidth='1.2'
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                    />
                                </svg>
                            </button>

                            {copied && <span className='text-[11px] text-[#ffffff88]'>Copied!</span>}
                        </div>
                    )}
                </div>
            </div>

            <div style={cardStyle} className={cardClass}>
                {isSuspended ? (
                    <div className='flex-1 text-center'>
                        <span className='text-red-100 text-xs'>
                            {server.status === 'suspended' ? 'Suspended' : 'Connection Error'}
                        </span>
                    </div>
                ) : isOffline ? (
                    <div className='flex items-center justify-between w-full gap-4'>
                        <span className='text-xs text-zinc-300'>Server is offline</span>
                        <button
                            onClick={handleStart}
                            disabled={isStarting}
                            className='inline-flex items-center gap-2 rounded-full bg-[#3f3f46] hover:bg-[#52525b] disabled:opacity-70 disabled:cursor-not-allowed text-white px-3 py-1.5 text-xs font-semibold transition-colors'
                        >
                            {isStarting && (
                                <svg
                                    className='animate-spin h-3.5 w-3.5'
                                    xmlns='http://www.w3.org/2000/svg'
                                    viewBox='0 0 24 24'
                                    fill='none'
                                >
                                    <circle
                                        className='opacity-25'
                                        cx='12'
                                        cy='12'
                                        r='10'
                                        stroke='currentColor'
                                        strokeWidth='4'
                                    />
                                    <path
                                        className='opacity-75'
                                        fill='currentColor'
                                        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z'
                                    />
                                </svg>
                            )}
                            Start
                        </button>
                    </div>
                ) : !stats ? (
                    server.isTransferring || server.status ? (
                        <div className='flex-1 text-center'>
                            <span className='text-zinc-100 text-xs'>
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
                    <Fragment>
                        <div className='sm:flex hidden'>
                            <div className='flex justify-center gap-2 w-fit'>
                                <p className='text-xs text-zinc-400 font-medium w-fit whitespace-nowrap'>CPU</p>
                                <p className='text-xs font-bold w-fit whitespace-nowrap'>
                                    {stats.cpuUsagePercent.toFixed(2)}%
                                </p>
                            </div>
                        </div>
                        <div className='sm:flex hidden'>
                            <div className='flex justify-center gap-2 w-fit'>
                                <p className='text-xs text-zinc-400 font-medium w-fit whitespace-nowrap'>RAM</p>
                                <p className='text-xs font-bold w-fit whitespace-nowrap'>
                                    {bytesToString(stats.memoryUsageInBytes, 0)}
                                </p>
                            </div>
                        </div>
                        <div className='sm:flex hidden'>
                            <div className='flex justify-center gap-2 w-fit'>
                                <p className='text-xs text-zinc-400 font-medium w-fit whitespace-nowrap'>Storage</p>
                                <p className='text-xs font-bold w-fit whitespace-nowrap'>
                                    {bytesToString(stats.diskUsageInBytes, 0)}
                                </p>
                            </div>
                        </div>
                    </Fragment>
                )}
            </div>
        </StatusIndicatorBox>
    );
};

export default ServerRow;
