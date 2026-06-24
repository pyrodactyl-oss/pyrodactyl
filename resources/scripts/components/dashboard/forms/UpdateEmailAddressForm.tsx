import { type Actions, type State, useStoreActions, useStoreState } from 'easy-peasy';
import { Form, Formik, type FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { httpErrorToHuman } from '@/api/http';
import ActionButton from '@/components/elements/ActionButton';
import Field from '@/components/elements/Field';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';

import type { ApplicationStore } from '@/state';

interface Values {
    email: string;
    password: string;
}

const schema = Yup.object().shape({
    email: Yup.string().email().required(),
    password: Yup.string().required('You must provide your current account password.'),
});

const UpdateEmailAddressForm = () => {
    const user = useStoreState((state: State<ApplicationStore>) => state.user.data);
    const updateEmail = useStoreActions((state: Actions<ApplicationStore>) => state.user.updateUserEmail);

    const { clearFlashes, addFlash } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const submit = (values: Values, { resetForm, setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('account:email');

        updateEmail({ ...values })
            .then(() =>
                addFlash({
                    type: 'success',
                    key: 'account:email',
                    message: 'Your primary email has been updated.',
                }),
            )
            .catch((error) =>
                addFlash({
                    type: 'error',
                    key: 'account:email',
                    title: 'Error',
                    message: httpErrorToHuman(error),
                }),
            )
            .then(() => {
                resetForm();
                setSubmitting(false);
            });
    };

    return (
        <Formik initialValues={{ email: user?.email, password: '' }} onSubmit={submit} validationSchema={schema}>
            {({ isSubmitting, isValid }) => (
                <>
                    <SpinnerOverlay size={'large'} visible={isSubmitting} />
                    <Form className={'m-0'}>
                        <Field id={'current_email'} label={'Email'} name={'email'} type={'email'} />
                        <div className={'mt-6'}>
                            <Field id={'confirm_password'} label={'Password'} name={'password'} type={'password'} />
                        </div>
                        <div className={'mt-6'}>
                            <ActionButton disabled={isSubmitting || !isValid} variant='secondary'>
                                Update Email
                            </ActionButton>
                        </div>
                    </Form>
                </>
            )}
        </Formik>
    );
};

export default UpdateEmailAddressForm;
