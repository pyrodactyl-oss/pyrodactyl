import http from '@/api/http';

export type ServerPowerState = 'offline' | 'starting' | 'running' | 'stopping' | 'installing';

export interface ServerStats {
    cpuUsagePercent: number;
    diskUsageInBytes: number;
    isInstalling: boolean;
    isSuspended: boolean;
    memoryUsageInBytes: number;
    networkRxInBytes: number;
    networkTxInBytes: number;
    status: ServerPowerState;
    uptime: number;
}

export default (server: string): Promise<ServerStats> =>
    new Promise((resolve, reject) => {
        http.get(`/api/client/servers/${server}/resources`)
            .then(({ data: { attributes } }) =>
                resolve({
                    status: attributes.current_state,
                    isSuspended: attributes.is_suspended,
                    isInstalling: attributes.is_installing,
                    memoryUsageInBytes: attributes.resources.memory_bytes,
                    cpuUsagePercent: attributes.resources.cpu_absolute,
                    diskUsageInBytes: attributes.resources.disk_bytes,
                    networkRxInBytes: attributes.resources.network_rx_bytes,
                    networkTxInBytes: attributes.resources.network_tx_bytes,
                    uptime: attributes.resources.uptime,
                }),
            )
            .catch(reject);
    });
