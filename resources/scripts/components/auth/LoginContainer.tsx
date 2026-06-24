import type { FormikHelpers } from 'formik';
import { Formik } from 'formik';
import { useNavigate } from 'react-router-dom';
import { object, string } from 'yup';
import login from '@/api/auth/login';
import LoginFormContainer, { TitleSection } from '@/components/auth/LoginFormContainer';
import Button from '@/components/elements/Button';
import Captcha, { getCaptchaResponse } from '@/components/elements/Captcha';
import Field from '@/components/elements/Field';
import CaptchaManager from '@/lib/captcha';

import useFlash from '@/plugins/useFlash';

import SecondaryLink from '../ui/secondary-link';

interface Values {
    password: string;
    user: string;
}

interface ErrorResponse {
    code: string;
    detail: string;
    message: string;
    response: string;
}

function LoginContainer() {
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const navigate = useNavigate();

    // useEffect(() => {
    //     clearFlashes();
    // }, []);

    const onSubmit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        // clearFlashes();

        let loginData: Values = values;
        if (CaptchaManager.isEnabled()) {
            const captchaResponse = getCaptchaResponse();
            const fieldName = CaptchaManager.getProviderInstance().getResponseFieldName();

            if (fieldName) {
                if (captchaResponse) {
                    loginData = { ...values, [fieldName]: captchaResponse };
                } else {
                    console.error('Captcha enabled but no response available');
                    clearAndAddHttpError({
                        error: new Error('Please complete the captcha verification.'),
                    });
                    setSubmitting(false);
                    return;
                }
            }
        } else {
        }

        login(loginData)
            .then((response) => {
                if (response.complete) {
                    clearFlashes();
                    window.location.href = response.intended || '/';
                    return;
                }
                navigate('/auth/login/checkpoint', {
                    state: { token: response.confirmationToken },
                });
            })
            .catch((error: ErrorResponse) => {
                setSubmitting(false);

                if (error.code === 'InvalidCredentials') {
                    clearAndAddHttpError({
                        error: new Error('Invalid username or password. Please try again.'),
                    });
                } else if (error.code === 'DisplayException') {
                    clearAndAddHttpError({
                        error: new Error(error.detail || error.message),
                    });
                } else {
                    clearAndAddHttpError({ error });
                }
            });
    };

    return (
        <Formik
            initialValues={{ user: '', password: '' }}
            onSubmit={onSubmit}
            validationSchema={object().shape({
                user: string().required('A username or email must be provided.'),
                password: string().required('Please enter your account password.'),
            })}
        >
            {({ isSubmitting }) => (
                <LoginFormContainer className={'flex flex-col gap-6'}>
                    <TitleSection title='Login' />
                    <div className=''>
                        <Field
                            disabled={isSubmitting}
                            id='user'
                            label={'Username or Email'}
                            name={'user'}
                            type={'text'}
                        />
                    </div>

                    <div className={'relative mt-6'}>
                        <Field
                            disabled={isSubmitting}
                            id='password'
                            label={'Password'}
                            name={'password'}
                            type={'password'}
                        />
                    </div>

                    <Captcha
                        className='mt-6'
                        onError={(error) => {
                            console.error('Captcha error:', error);
                            clearAndAddHttpError({
                                error: new Error('Captcha verification failed. Please try again.'),
                            });
                        }}
                    />

                    <div className='flex w-full items-center justify-between'>
                        <Button
                            className={
                                'rounded-full bg-mocha-100 p-2 px-4 text-black ease-in-out hover:scale-102 hover:cursor-pointer hover:bg-mocha-200'
                            }
                            disabled={isSubmitting}
                            isLoading={isSubmitting}
                            size={'xlarge'}
                            type={'submit'}
                        >
                            Sign in
                        </Button>
                        <SecondaryLink to='/auth/password'>Forgot your password?</SecondaryLink>
                    </div>
                </LoginFormContainer>
            )}
        </Formik>
    );
}

export default LoginContainer;
