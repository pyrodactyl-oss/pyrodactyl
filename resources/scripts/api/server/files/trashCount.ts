import http from '@/api/http';
import { getGlobalDaemonType } from '@/api/server/getServer';

export default (uuid: string): Promise<number> => {
    return new Promise((resolve, reject) => {
        http.get(`/api/client/servers/${getGlobalDaemonType()}/${uuid}/files/trash/count`)
            .then(({ data }) => resolve(data.count || 0))
            .catch(reject);
    });
};
