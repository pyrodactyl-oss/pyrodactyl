import http from '@/api/http';

import type { PanelPermissions } from '@/state/permissions';

export default (): Promise<PanelPermissions> =>
    new Promise((resolve, reject) => {
        http.get('/api/client/permissions')
            .then(({ data }) => resolve(data.attributes.permissions))
            .catch(reject);
    });
