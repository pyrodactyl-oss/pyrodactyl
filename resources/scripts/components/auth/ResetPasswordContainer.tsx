import { Formik, type FormikHelpers } from 'formik';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { object, ref, string } from 'yup';
import performPasswordReset from '@/api/auth/performPasswordReset';
import LoginFormContainer from '@/components/auth/LoginFormContainer';
import Button from '@/components/elements/Button';
import Captcha, { getCaptchaResponse } from '@/components/elements/Captcha';
import ContentBox from '@/components/elements/ContentBox';
import Field from '@/components/elements/Field';
import Input from '@/components/elements/Input';
import CaptchaManager from '@/lib/captcha';

import useFlash from '@/plugins/useFlash';

import Logo from '../elements/PyroLogo';

interface Values {
    password: string;
    password_confirmation: string;
}

function ResetPasswordContainer() {
    const [email, setEmail] = useState('');

    const { clearFlashes, clearAndAddHttpError } = useFlash();

    useEffect(() => {
        clearFlashes();
    }, []);

    const parsed = new URLSearchParams(location.search);
    if (email.length === 0 && parsed.get('email')) {
        setEmail(parsed.get('email') || '');
    }

    const params = useParams<'token'>();

    const submit = ({ password, password_confirmation }: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes();

        // Get captcha response if enabled
        const captchaResponse = getCaptchaResponse();

        let resetData: any = {
            token: params.token ?? '',
            password,
            password_confirmation,
        };
        if (CaptchaManager.isEnabled()) {
            const fieldName = CaptchaManager.getProviderInstance().getResponseFieldName();

            console.log('Captcha enabled, response:', captchaResponse, 'fieldName:', fieldName);

            if (fieldName) {
                if (captchaResponse) {
                    resetData = {
                        ...resetData,
                        [fieldName]: captchaResponse,
                    };

                    console.log('Adding captcha to reset data:');
                    console.debug(resetData);
                } else {
                    console.error('Captcha enabled but no response available');
                    console.log(captchaResponse);
                    clearAndAddHttpError({
                        error: new Error('Please complete the captcha verification.'),
                    });
                    setSubmitting(false);
                    return;
                }
            }
        } else {
            console.log('Captcha not enabled');
        }

        performPasswordReset(email, resetData)
            .then(() => {
                // @ts-expect-error this is valid
                window.location = '/';
            })
            .catch((error) => {
                console.error(error);

                setSubmitting(false);
                clearAndAddHttpError({
                    error: new Error(error),
                });
            });
    };

    return (
        <ContentBox>
            <Formik
                initialValues={{
                    password: '',
                    password_confirmation: '',
                }}
                onSubmit={submit}
                validationSchema={object().shape({
                    password: string()
                        .required('A new password is required.')
                        .min(8, 'Your new password should be at least 8 characters in length.'),
                    password_confirmation: string()
                        .required('Your new password does not match.')
                        .oneOf([ref('password')], 'Your new password does not match.'),
                })}
            >
                {({ isSubmitting }) => (
                    <LoginFormContainer className={'flex w-full'}>
                        <Link to='/'>
                            <div className='mb-4 flex h-12 w-full items-center'>
                                <Logo />
                            </div>
                        </Link>
                        <div aria-hidden className='my-8 min-h-[1px] bg-[#ffffff33]' />

                        <div className='text-center'>
                            <Input className='text-center' disabled value={email} />
                        </div>
                        <div className={'mt-6'}>
                            <Field
                                description={'Passwords must be at least 8 characters in length.'}
                                label={'New Password'}
                                name={'password'}
                                type={'password'}
                            />
                        </div>
                        <div className={'mt-6'}>
                            <Field label={'Confirm New Password'} name={'password_confirmation'} type={'password'} />
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

                        <div className={'mt-6'}>
                            <Button
                                className='mt-4 w-full rounded-full border-0 bg-brand py-2 font-bold text-sm capitalize outline-hidden ring-0'
                                disabled={isSubmitting}
                                isLoading={isSubmitting}
                                size={'xlarge'}
                                type={'submit'}
                            >
                                Reset Password
                            </Button>
                        </div>
                        <div aria-hidden className='my-8 min-h-[1px] bg-[#ffffff33]' />

                        <div
                            className={
                                'w-full rounded-lg border-0 bg-[#ffffff33] py-2 text-center font-bold text-sm capitalize outline-hidden ring-0'
                            }
                        >
                            <Link
                                className={
                                    'border-color-[#ffffff33] pt-4 text-white text-xs uppercase tracking-wide no-underline hover:text-neutral-700'
                                }
                                to={'/auth/login'}
                            >
                                Return to Login
                            </Link>
                        </div>
                    </LoginFormContainer>
                )}
            </Formik>
        </ContentBox>
    );
}

export default ResetPasswordContainer;
