import http from '@/api/http';
import { getGlobalDaemonType } from '@/api/server/getServer';

export default (uuid: string): Promise<void> =>
    new Promise((resolve, reject) => {
        http.post(`/api/client/servers/${getGlobalDaemonType()}/${uuid}/settings/reinstall`)
            .then(() => resolve())
            .catch(reject);
    });
