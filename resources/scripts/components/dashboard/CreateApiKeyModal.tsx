import { Field, Form, Formik, type FormikHelpers } from 'formik';
import { object, string } from 'yup';
import { Dialog } from '@/components/elements/dialog';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import Input from '@/components/elements/Input';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';

interface CreateValues {
    allowedIps: string;
    description: string;
}

interface CreateApiKeyModalProps {
    isSubmitting?: boolean;
    onClose: () => void;
    onSubmit: (values: CreateValues, helpers: FormikHelpers<CreateValues>) => void;
    open: boolean;
}

const validationSchema = object().shape({
    description: string().required('Description is required').min(4, 'Must be at least 4 characters'),
    allowedIps: string(),
});

export default function CreateApiKeyModal({ open, onClose, onSubmit, isSubmitting = false }: CreateApiKeyModalProps) {
    return (
        <Dialog.Confirm
            confirm='Create Key'
            // Optional: disable confirm button while submitting
            confirmDisabled={isSubmitting}
            onClose={onClose}
            onConfirmed={() => {
                // Trigger form submission programmatically
                const form = document.getElementById('create-api-form') as HTMLFormElement;
                if (form) {
                    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
                    if (submitButton) submitButton.click();
                }
            }}
            open={open}
            title='Create API Key'
        >
            <Formik
                initialValues={{ description: '', allowedIps: '' }}
                onSubmit={onSubmit}
                validationSchema={validationSchema}
            >
                {({ isSubmitting: formikIsSubmitting }) => (
                    <Form className='space-y-4' id='create-api-form'>
                        <SpinnerOverlay visible={formikIsSubmitting || isSubmitting} />

                        <FormikFieldWrapper
                            description='A description of this API key.'
                            label='Description'
                            name='description'
                        >
                            <Field as={Input} autoFocus className='w-full' name='description' />
                        </FormikFieldWrapper>

                        <FormikFieldWrapper
                            description={
                                'Leave blank to allow any IP address. ' +
                                'Otherwise provide each IP or CIDR range on a new line (e.g. 192.168.1.1, 10.0.0.0/24).'
                            }
                            label='Allowed IPs'
                            name='allowedIps'
                        >
                            <Field
                                as='textarea'
                                className='w-full rounded border border-[#ffffff12] bg-[#ffffff0d] p-3 text-sm text-zinc-100 focus:border-blue-500 focus:outline-none'
                                name='allowedIps'
                                rows={4}
                            />
                        </FormikFieldWrapper>

                        {/* Hidden submit button — triggered by Dialog confirm */}
                        <button className='hidden' type='submit' />
                    </Form>
                )}
            </Formik>
        </Dialog.Confirm>
    );
}
