import http from '@/api/http';

export interface ApiKey {
    allowedIps: string[];
    createdAt: Date | null;
    description: string;
    identifier: string;
    lastUsedAt: Date | null;
}

export const rawDataToApiKey = (data: any): ApiKey => ({
    identifier: data.identifier,
    description: data.description,
    allowedIps: data.allowed_ips,
    createdAt: data.created_at ? new Date(data.created_at) : null,
    lastUsedAt: data.last_used_at ? new Date(data.last_used_at) : null,
});

export default (): Promise<ApiKey[]> =>
    new Promise((resolve, reject) => {
        http.get('/api/client/account/api-keys')
            .then(({ data }) => resolve((data.data || []).map((d: any) => rawDataToApiKey(d.attributes))))
            .catch(reject);
    });
