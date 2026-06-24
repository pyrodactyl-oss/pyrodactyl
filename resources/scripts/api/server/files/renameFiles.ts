import http from '@/api/http';
import { getGlobalDaemonType } from '@/api/server/getServer';

interface Data {
    from: string;
    to: string;
}

export default (uuid: string, directory: string, files: Data[]): Promise<void> =>
    new Promise((resolve, reject) => {
        http.put(`/api/client/servers/${getGlobalDaemonType()}/${uuid}/files/rename`, { root: directory, files })
            .then(() => resolve())
            .catch(reject);
    });
