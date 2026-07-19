import http from '@/api/http';

export const toggleGhostMode = (): Promise<boolean> => {
    return http.post('/api/client/ghost-mode').then(({ data }) => data.ghost_mode);
};

export const getGhostModeStatus = (): Promise<{ ghost_mode: boolean; available: boolean }> => {
    return http.get('/api/client/ghost-mode').then(({ data }) => data);
};
