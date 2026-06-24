import type { FormikHelpers } from 'formik';
import { Formik } from 'formik';
import { object, string } from 'yup';
import http, { httpErrorToHuman } from '@/api/http';
import LoginFormContainer, { TitleSection } from '@/components/auth/LoginFormContainer';
import Button from '@/components/elements/Button';
import Captcha, { getCaptchaResponse } from '@/components/elements/Captcha';
import Field from '@/components/elements/Field';
import CaptchaManager from '@/lib/captcha';
import useFlash from '@/plugins/useFlash';
import SecondaryLink from '../ui/secondary-link';

interface Values {
    email: string;
}

const ForgotPasswordContainer = () => {
    const { clearFlashes, addFlash } = useFlash();

    const handleSubmission = ({ email }: Values, { setSubmitting, resetForm }: FormikHelpers<Values>) => {
        clearFlashes();

        // Get captcha response if enabled
        const captchaResponse = getCaptchaResponse();

        let requestData: any = { email };
        if (CaptchaManager.isEnabled() && captchaResponse) {
            const fieldName = CaptchaManager.getProviderInstance().getResponseFieldName();
            if (fieldName) {
                requestData = { ...requestData, [fieldName]: captchaResponse };
            }
        }

        http.post('/auth/password', requestData)
            .then((response) => {
                resetForm();
                addFlash({
                    type: 'success',
                    title: 'Success',
                    message: response.data.status || 'Email sent!',
                });
            })
            .catch((error) => {
                console.error(error);
                addFlash({
                    type: 'error',
                    title: 'Error',
                    message: httpErrorToHuman(error),
                });
            })
            .finally(() => {
                setSubmitting(false);
            });
    };

    return (
        <Formik
            initialValues={{ email: '' }}
            onSubmit={handleSubmission}
            validationSchema={object().shape({
                email: string().email('Enter a valid email address.').required('Email is required.'),
            })}
        >
            {({ isSubmitting }) => (
                <LoginFormContainer className={'flex w-full flex-col'}>
                    <TitleSection title='Forgot Password' />
                    <div className='mb-6 text-sm'>We&apos;ll send you an email with a link to reset your password.</div>
                    <Field id='email' label={'Email'} name={'email'} type={'email'} />

                    <div className='flex w-full items-center justify-between'>
                        <Button
                            className={
                                'mt-4 rounded-full border-0 bg-mocha-100 p-2 px-4 text-black capitalize outline-hidden ring-0'
                            }
                            disabled={isSubmitting}
                            isLoading={isSubmitting}
                            size='xlarge'
                            type='submit'
                        >
                            Send Email
                        </Button>

                        <SecondaryLink to='/auth/login'>Return to Login?</SecondaryLink>
                    </div>

                    <Captcha
                        className='mt-6'
                        onError={(error) => {
                            console.error('Captcha error:', error);
                            addFlash({
                                type: 'error',
                                title: 'Error',
                                message: 'Captcha verification failed. Please try again.',
                            });
                        }}
                    />
                </LoginFormContainer>
            )}
        </Formik>
    );
};

export default ForgotPasswordContainer;
