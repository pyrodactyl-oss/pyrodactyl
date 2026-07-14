import http from '@/api/http';
import { getGlobalDaemonType } from '@/api/server/getServer';

export default (uuid: string, trashedFileUuid: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        http.post(`/api/client/servers/${getGlobalDaemonType()}/${uuid}/files/trash/${trashedFileUuid}/restore`)
            .then(() => resolve())
            .catch(reject);
    });
};
