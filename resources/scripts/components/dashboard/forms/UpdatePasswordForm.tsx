import { Actions, State, useStoreActions, useStoreState } from 'easy-peasy';
import { Form, Formik, FormikHelpers } from 'formik';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import * as Yup from 'yup';

import i18n from '@/lib/i18n';

import ActionButton from '@/components/elements/ActionButton';
import Field from '@/components/elements/Field';
import Spinner from '@/components/elements/Spinner';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';

import updateAccountPassword from '@/api/account/updateAccountPassword';
import { httpErrorToHuman } from '@/api/http';

import { ApplicationStore } from '@/state';

interface Values {
    current: string;
    password: string;
    confirmPassword: string;
}

const UpdatePasswordForm = () => {
    const { t } = useTranslation('dashboard');
    const user = useStoreState((state: State<ApplicationStore>) => state.user.data);
    const { clearFlashes, addFlash } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    if (!user) {
        return null;
    }

    const schema = Yup.object().shape({
        current: Yup.string().min(1).required(t('password_form.current_required')),
        password: Yup.string().min(8).required(t('password_form.password_required')),
        confirmPassword: Yup.string().test(
            'password',
            t('password_form.confirm_mismatch'),
            function (value) {
                return value === this.parent.password;
            },
        ),
    });

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('account:password');
        updateAccountPassword({ ...values })
            .then(() => {
                // @ts-expect-error this is valid
                window.location = '/auth/login';
            })
            .catch((error) =>
                addFlash({
                    key: 'account:password',
                    type: 'error',
                    title: i18n.t('strings:error'),
                    message: httpErrorToHuman(error),
                }),
            )
            .then(() => setSubmitting(false));
    };

    return (
        <Fragment>
            <Formik
                onSubmit={submit}
                validationSchema={schema}
                initialValues={{ current: '', password: '', confirmPassword: '' }}
            >
                {({ isSubmitting, isValid }) => (
                    <Fragment>
                        <SpinnerOverlay size={'large'} visible={isSubmitting} />
                        <Form className={`m-0`}>
                            <Field
                                id={'current_password'}
                                type={'password'}
                                name={'current'}
                                label={t('password_form.current_label')}
                            />
                            <div className={`mt-6`}>
                                <Field
                                    id={'new_password'}
                                    type={'password'}
                                    name={'password'}
                                    label={t('password_form.new_label')}
                                    description={t('password_form.new_description')}
                                />
                            </div>
                            <div className={`mt-6`}>
                                <Field
                                    id={'confirm_new_password'}
                                    type={'password'}
                                    name={'confirmPassword'}
                                    label={t('password_form.confirm_label')}
                                />
                            </div>
                            <div className={`mt-6`}>
                                <ActionButton variant='primary' disabled={isSubmitting || !isValid}>
                                    {isSubmitting && <Spinner size='small' />}
                                    {isSubmitting ? t('password_form.updating') : t('password_form.update_button')}
                                </ActionButton>
                            </div>
                        </Form>
                    </Fragment>
                )}
            </Formik>
        </Fragment>
    );
};

export default UpdatePasswordForm;
