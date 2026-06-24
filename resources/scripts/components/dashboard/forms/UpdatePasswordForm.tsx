import { type Actions, type State, useStoreActions, useStoreState } from 'easy-peasy';
import { Form, Formik, type FormikHelpers } from 'formik';
import { Fragment } from 'react';
import * as Yup from 'yup';
import updateAccountPassword from '@/api/account/updateAccountPassword';
import { httpErrorToHuman } from '@/api/http';
import ActionButton from '@/components/elements/ActionButton';
import Field from '@/components/elements/Field';
import Spinner from '@/components/elements/Spinner';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';

import type { ApplicationStore } from '@/state';

interface Values {
    confirmPassword: string;
    current: string;
    password: string;
}

const schema = Yup.object().shape({
    current: Yup.string().min(1).required('You must provide your current account password.'),
    password: Yup.string().min(8).required(),
    confirmPassword: Yup.string().test(
        'password',
        'Password confirmation does not match the password you entered.',
        function (value) {
            return value === this.parent.password;
        },
    ),
});

const UpdatePasswordForm = () => {
    const user = useStoreState((state: State<ApplicationStore>) => state.user.data);
    const { clearFlashes, addFlash } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    if (!user) {
        return null;
    }

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
                    title: 'Error',
                    message: httpErrorToHuman(error),
                }),
            )
            .then(() => setSubmitting(false));
    };

    return (
        <Fragment>
            <Formik
                initialValues={{ current: '', password: '', confirmPassword: '' }}
                onSubmit={submit}
                validationSchema={schema}
            >
                {({ isSubmitting, isValid }) => (
                    <Fragment>
                        <SpinnerOverlay size={'large'} visible={isSubmitting} />
                        <Form className={'m-0'}>
                            <Field
                                id={'current_password'}
                                label={'Current Password'}
                                name={'current'}
                                type={'password'}
                            />
                            <div className={'mt-6'}>
                                <Field
                                    description={
                                        'Your new password should be at least 8 characters in length and unique to this website.'
                                    }
                                    id={'new_password'}
                                    label={'New Password'}
                                    name={'password'}
                                    type={'password'}
                                />
                            </div>
                            <div className={'mt-6'}>
                                <Field
                                    id={'confirm_new_password'}
                                    label={'Confirm New Password'}
                                    name={'confirmPassword'}
                                    type={'password'}
                                />
                            </div>
                            <div className={'mt-6'}>
                                <ActionButton disabled={isSubmitting || !isValid} variant='secondary'>
                                    {isSubmitting && <Spinner size='small' />}
                                    {isSubmitting ? 'Updating...' : 'Update Password'}
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
