import type { FormikHelpers } from 'formik';
import { Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { object, string } from 'yup';

import LoginFormContainer from '@/components/auth/LoginFormContainer';
import Button from '@/components/elements/Button';
import Captcha, { getCaptchaResponse } from '@/components/elements/Captcha';
import ContentBox from '@/components/elements/ContentBox';
import Field from '@/components/elements/Field';

import CaptchaManager from '@/lib/captcha';
import i18n from '@/lib/i18n';

import { httpErrorToHuman } from '@/api/http';
import http from '@/api/http';

import useFlash from '@/plugins/useFlash';

import Logo from '../elements/PyroLogo';

interface Values {
    email: string;
}

const ForgotPasswordContainer = () => {
    const { t } = useTranslation('auth');
    const { clearFlashes, addFlash } = useFlash();

    const handleSubmission = ({ email }: Values, { setSubmitting, resetForm }: FormikHelpers<Values>) => {
        clearFlashes();

        let requestData: any = { email };
        if (CaptchaManager.isEnabled()) {
            const captchaResponse = getCaptchaResponse();
            const fieldName = CaptchaManager.getProviderInstance().getResponseFieldName();
            if (fieldName && captchaResponse) {
                requestData = { ...requestData, [fieldName]: captchaResponse };
            }
        }

        http.post('/auth/password', requestData)
            .then((response) => {
                resetForm();
                addFlash({
                    type: 'success',
                    title: i18n.t('strings:success'),
                    message: response.data.status || i18n.t('auth:forgot.success'),
                });
            })
            .catch((error) => {
                console.error(error);
                addFlash({ type: 'error', title: i18n.t('strings:error'), message: httpErrorToHuman(error) });
            })
            .finally(() => setSubmitting(false));
    };

    return (
        <ContentBox>
            <Formik
                onSubmit={handleSubmission}
                initialValues={{ email: '' }}
                validationSchema={object().shape({
                    email: string()
                        .email(i18n.t('auth:forgot.email_valid'))
                        .required(i18n.t('auth:forgot.email_required')),
                })}
            >
                {({ isSubmitting }) => (
                    <LoginFormContainer className={`w-full flex`}>
                        <Link to='/'>
                            <div className='flex h-12 mb-4 items-center w-full'>
                                <Logo />
                            </div>
                        </Link>
                        <div aria-hidden className='my-8 bg-[#ffffff33] min-h-[1px]'></div>
                        <h2 className='text-xl font-extrabold mb-2'>{t('forgot.title')}</h2>
                        <div className='text-sm mb-6'>{t('forgot.description')}</div>
                        <Field id='email' label={t('email_label')} name={'email'} type={'email'} />
                        <Captcha
                            className='mt-6'
                            onError={() => {
                                addFlash({
                                    type: 'error',
                                    title: i18n.t('strings:error'),
                                    message: i18n.t('auth:captcha_failed'),
                                });
                            }}
                        />
                        <div className='mt-6'>
                            <Button
                                className={`w-full mt-4 rounded-full bg-brand border-0 ring-0 outline-hidden capitalize font-bold text-sm py-2`}
                                type='submit'
                                size='xlarge'
                                isLoading={isSubmitting}
                                disabled={isSubmitting}
                            >
                                {t('forgot.send_email')}
                            </Button>
                        </div>
                        <div aria-hidden className='my-8 bg-[#ffffff33] min-h-[1px]'></div>
                        <div
                            className={`text-center w-full rounded-lg border-0 ring-0 outline-hidden capitalize font-bold text-sm py-2 `}
                        >
                            <Link
                                to='/auth/login'
                                className='block w-full text-center py-2.5 px-4 text-xs font-medium tracking-wide uppercase text-white hover:text-white/80 transition-colors duration-200 border border-white/20 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30'
                            >
                                {t('forgot.return_to_login')}
                            </Link>
                        </div>
                    </LoginFormContainer>
                )}
            </Formik>
        </ContentBox>
    );
};

export default ForgotPasswordContainer;
