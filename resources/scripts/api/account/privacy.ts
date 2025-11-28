import http from '@/api/http';

export type PrivacyResponse = { privacy_blur: boolean };

export const getPrivacy = async (): Promise<PrivacyResponse> => {
    const { data } = await http.get('/api/client/account/privacy');
    return data;
};

export const updatePrivacy = async (privacy_blur: boolean): Promise<PrivacyResponse> => {
    const { data } = await http.put('/api/client/account/privacy', {
        privacy_blur,
    });
    return data;
};
