import http from '@/api/http';
import { getGlobalDaemonType } from '@/api/server/getServer';

export const bulkRestore = (uuid: string, uuids: string[]): Promise<void> => {
    return http.post(`/api/client/servers/${getGlobalDaemonType()}/${uuid}/files/trash/bulk-restore`, { uuids });
};

export const bulkDelete = (uuid: string, uuids: string[]): Promise<void> => {
    return http.post(`/api/client/servers/${getGlobalDaemonType()}/${uuid}/files/trash/bulk-delete`, { uuids });
};
