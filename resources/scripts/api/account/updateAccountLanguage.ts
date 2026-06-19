import http from '@/api/http';

export default (language: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        http.put('/api/client/account/language', { language })
            .then(() => resolve())
            .catch(reject);
    });
};
