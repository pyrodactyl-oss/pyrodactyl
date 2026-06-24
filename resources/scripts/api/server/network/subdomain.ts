import http from '@/api/http';
import { getGlobalDaemonType } from '@/api/server/getServer';

export interface SubdomainInfo {
    available_domains: Array<{
        id: number;
        name: string;
        is_active: boolean;
    }>;
    current_subdomain?: {
        object: string;
        attributes: {
            subdomain: string;
            domain: string;
            domain_id: number;
            full_domain: string;
            is_active: boolean;
        };
    };
    message?: string;
    supported: boolean;
}

export interface AvailabilityResponse {
    available: boolean;
    message: string;
}
const _daemonType = getGlobalDaemonType();

export const getSubdomainInfo = (uuid: string): Promise<SubdomainInfo> =>
    new Promise((resolve, reject) => {
        http.get(`/api/client/servers/${uuid}/subdomain`)
            .then(({ data }) => resolve(data))
            .catch(reject);
    });

export const setSubdomain = (uuid: string, subdomain: string, domainId: number): Promise<void> =>
    new Promise((resolve, reject) => {
        http.post(`/api/client/servers/${uuid}/subdomain`, {
            subdomain,
            domain_id: domainId,
        })
            .then(() => resolve())
            .catch(reject);
    });

export const deleteSubdomain = (uuid: string): Promise<void> =>
    new Promise((resolve, reject) => {
        http.delete(`/api/client/servers/${uuid}/subdomain`)
            .then(() => resolve())
            .catch(reject);
    });

export const checkSubdomainAvailability = (
    uuid: string,
    subdomain: string,
    domainId: number,
): Promise<AvailabilityResponse> =>
    new Promise((resolve, reject) => {
        http.post(`/api/client/servers/${uuid}/subdomain/check-availability`, {
            subdomain,
            domain_id: domainId,
        })
            .then(({ data }) => resolve(data))
            .catch(reject);
    });
