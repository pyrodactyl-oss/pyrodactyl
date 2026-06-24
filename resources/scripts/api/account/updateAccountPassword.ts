import http from '@/api/http';

interface Data {
    confirmPassword: string;
    current: string;
    password: string;
}

export default ({ current, password, confirmPassword }: Data): Promise<void> =>
    new Promise((resolve, reject) => {
        http.put('/api/client/account/password', {
            current_password: current,
            password,
            password_confirmation: confirmPassword,
        })
            .then(() => resolve())
            .catch(reject);
    });
