import { type Actions, useStoreActions } from 'easy-peasy';
import { Field, Form, Formik, type FormikHelpers } from 'formik';
import { useState } from 'react';
import { object, string } from 'yup';
import createApiKey from '@/api/account/createApiKey';
import type { ApiKey } from '@/api/account/getApiKeys';
import { httpErrorToHuman } from '@/api/http';
import ApiKeyModal from '@/components/dashboard/ApiKeyModal';
import ActionButton from '@/components/elements/ActionButton';
import ContentBox from '@/components/elements/ContentBox';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import Input from '@/components/elements/Input';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import FlashMessageRender from '@/components/FlashMessageRender';

import type { ApplicationStore } from '@/state';

interface Values {
    allowedIps: string;
    description: string;
}

const CreateApiKeyForm = ({ onKeyCreated }: { onKeyCreated: (key: ApiKey) => void }) => {
    const [apiKey, setApiKey] = useState('');
    const { addError, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const submit = (values: Values, { setSubmitting, resetForm }: FormikHelpers<Values>) => {
        clearFlashes('account');
        createApiKey(values.description, values.allowedIps)
            .then(({ secretToken, ...key }) => {
                resetForm();
                setSubmitting(false);
                setApiKey(`${key.identifier}${secretToken}`);
                onKeyCreated(key);
            })
            .catch((error) => {
                console.error(error);

                addError({ key: 'account', message: httpErrorToHuman(error) });
                setSubmitting(false);
            });
    };

    return (
        <>
            {/* Flash Messages */}
            <FlashMessageRender byKey='account' />

            {/* Modal for API Key */}
            <ApiKeyModal apiKey={apiKey} onModalDismissed={() => setApiKey('')} visible={apiKey.length > 0} />

            {/* Form for creating API key */}
            <ContentBox>
                <Formik
                    initialValues={{ description: '', allowedIps: '' }}
                    onSubmit={submit}
                    validationSchema={object().shape({
                        allowedIps: string(),
                        description: string().required().min(4),
                    })}
                >
                    {({ isSubmitting }) => (
                        <Form className='space-y-6'>
                            {/* Show spinner overlay when submitting */}
                            <SpinnerOverlay visible={isSubmitting} />

                            {/* Description Field */}
                            <FormikFieldWrapper
                                description='A description of this API key.'
                                label='Description'
                                name='description'
                            >
                                <Field as={Input} className='w-full' name='description' />
                            </FormikFieldWrapper>

                            {/* Allowed IPs Field */}
                            <FormikFieldWrapper
                                description='Leave blank to allow any IP address to use this API key, otherwise provide each IP address on a new line.'
                                label='Allowed IPs'
                                name='allowedIps'
                            >
                                <Field as={Input} className='w-full' name='allowedIps' />
                            </FormikFieldWrapper>

                            {/* Submit Button below form fields */}
                            <div className='mt-6 flex justify-end'>
                                <ActionButton disabled={isSubmitting} type='submit'>
                                    {isSubmitting ? 'Creating...' : 'Create API Key'}
                                </ActionButton>
                            </div>
                        </Form>
                    )}
                </Formik>
            </ContentBox>
        </>
    );
};

CreateApiKeyForm.displayName = 'CreateApiKeyForm';
export default CreateApiKeyForm;
