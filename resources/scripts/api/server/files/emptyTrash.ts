import http from '@/api/http';
import { getGlobalDaemonType } from '@/api/server/getServer';

export default (uuid: string, trashedFileUuid?: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const url = trashedFileUuid
            ? `/api/client/servers/${getGlobalDaemonType()}/${uuid}/files/trash/${trashedFileUuid}`
            : `/api/client/servers/${getGlobalDaemonType()}/${uuid}/files/trash`;

        http.delete(url)
            .then(() => resolve())
            .catch(reject);
    });
};
