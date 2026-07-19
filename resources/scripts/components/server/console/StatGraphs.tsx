import { ArrowDownToLine, ArrowUpToLine } from '@gravity-ui/icons';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';

import ChartBlock from '@/components/server/console/ChartBlock';
import { useChart, useChartTickLabel } from '@/components/server/console/chart';
import { SocketEvent } from '@/components/server/events';

import { hexToRgba } from '@/lib/helpers';
import i18n from '@/lib/i18n';

import { useStoreState } from '@/state/hooks';
import { ServerContext } from '@/state/server';

import useFormatBytes from '@/plugins/useFormatBytes';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';

const StatGraphs = () => {
    const status = ServerContext.useStoreState((state) => state.status.value);
    const limits = ServerContext.useStoreState((state) => state.server.data!.limits);
    const previous = useRef<Record<'tx' | 'rx', number>>({ tx: -1, rx: -1 });
    const formatBytes = useFormatBytes();
    const sizeDisplay = useStoreState((state) => state.user.data?.sizeDisplay ?? 'mib');

    const cpu = useChartTickLabel(i18n.t('server:stats.cpu'), limits.cpu, '%', 2);
    const memory = useChartTickLabel(
        i18n.t('server:stats.memory'),
        limits.memory,
        sizeDisplay === 'mib' ? 'MiB' : 'MB',
    );
    const network = useChart(i18n.t('server:stats.network'), {
        sets: 2,
        options: {
            scales: {
                y: {
                    ticks: {
                        callback(value) {
                            return formatBytes(typeof value === 'string' ? parseInt(value, 10) : value);
                        },
                    },
                },
            },
        },
        callback(opts, index) {
            return {
                ...opts,
                label: !index ? i18n.t('server:stats.network_in') : i18n.t('server:stats.network_out'),
                borderColor: !index ? '#facc15' : '#60a5fa',
                backgroundColor: hexToRgba(!index ? '#facc15' : '#60a5fa', 0.09),
            };
        },
    });

    useEffect(() => {
        if (status === 'offline') {
            cpu.clear();
            memory.clear();
            network.clear();
        }
    }, [status]);

    useWebsocketEvent(SocketEvent.STATS, (data: string) => {
        let values: any = {};
        try {
            values = JSON.parse(data);
        } catch (e) {
            return;
        }
        cpu.push(values.cpu_absolute);
        memory.push(Math.floor(values.memory_bytes / 1024 / 1024));
        network.push([
            previous.current.tx < 0 ? 0 : Math.max(0, values.network.tx_bytes - previous.current.tx),
            previous.current.rx < 0 ? 0 : Math.max(0, values.network.rx_bytes - previous.current.rx),
        ]);

        previous.current = { tx: values.network.tx_bytes, rx: values.network.rx_bytes };
    });

    return (
        <Tooltip.Provider>
            <div
                className='transform-gpu skeleton-anim-2'
                style={{
                    animationDelay: `250ms`,
                    animationTimingFunction:
                        'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                }}
            >
                <ChartBlock title={i18n.t('server:stats.cpu')}>
                    <Line aria-label={i18n.t('server:stats.cpu_usage')} role='img' {...cpu.props} />
                </ChartBlock>
            </div>
            <div
                className='transform-gpu skeleton-anim-2'
                style={{
                    animationDelay: `275ms`,
                    animationTimingFunction:
                        'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                }}
            >
                <ChartBlock title={i18n.t('server:stats.ram')}>
                    <Line aria-label={i18n.t('server:stats.memory_usage')} role='img' {...memory.props} />
                </ChartBlock>
            </div>
            <div
                className='transform-gpu skeleton-anim-2'
                style={{
                    animationDelay: `300ms`,
                    animationTimingFunction:
                        'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                }}
            >
                <ChartBlock
                    title={i18n.t('server:stats.network_activity')}
                    legend={
                        <div className='flex gap-2'>
                            <Tooltip.Root delayDuration={200}>
                                <Tooltip.Trigger asChild>
                                    <div className='flex items-center cursor-default'>
                                        <ArrowDownToLine
                                            width={22}
                                            height={22}
                                            fill='currentColor'
                                            className='mr-2 text-yellow-400'
                                        />
                                    </div>
                                </Tooltip.Trigger>
                                <Tooltip.Portal>
                                    <Tooltip.Content
                                        side='top'
                                        className='px-2 py-1 text-sm bg-gray-800 text-gray-100 rounded shadow-lg'
                                        sideOffset={5}
                                    >
                                        {i18n.t('server:stats.inbound')}
                                        <Tooltip.Arrow className='fill-gray-800' />
                                    </Tooltip.Content>
                                </Tooltip.Portal>
                            </Tooltip.Root>

                            <Tooltip.Root delayDuration={200}>
                                <Tooltip.Trigger asChild>
                                    <div className='flex items-center cursor-default'>
                                        <ArrowUpToLine
                                            width={22}
                                            height={22}
                                            fill='currentColor'
                                            className='text-blue-400'
                                        />
                                    </div>
                                </Tooltip.Trigger>
                                <Tooltip.Portal>
                                    <Tooltip.Content
                                        side='top'
                                        className='px-2 py-1 text-sm bg-gray-800 text-gray-100 rounded shadow-lg'
                                        sideOffset={5}
                                    >
                                        {i18n.t('server:stats.outbound')}
                                        <Tooltip.Arrow className='fill-gray-800' />
                                    </Tooltip.Content>
                                </Tooltip.Portal>
                            </Tooltip.Root>
                        </div>
                    }
                >
                    <Line aria-label={i18n.t('server:stats.network_activity_aria')} role='img' {...network.props} />
                </ChartBlock>
            </div>
        </Tooltip.Provider>
    );
};

export default StatGraphs;
