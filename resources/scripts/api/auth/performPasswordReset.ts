import http from '@/api/http';

interface Data {
    password: string;
    passwordConfirmation: string;
    token: string;
    [key: string]: string;
}

interface PasswordResetResponse {
    redirectTo?: string | null;
    sendToLogin: boolean;
}

export default (email: string, data: Data): Promise<PasswordResetResponse> =>
    new Promise((resolve, reject) => {
        http.post('/auth/password/reset', {
            email,
            ...data,
        })
            .then((response) =>
                resolve({
                    redirectTo: response.data.redirect_to,
                    sendToLogin: response.data.send_to_login,
                }),
            )
            .catch(reject);
    });
