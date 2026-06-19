import { Eye, EyeSlash, Key, Plus, TrashBin } from '@gravity-ui/icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Actions, useStoreActions } from 'easy-peasy';
import { Field, Form, Formik, FormikHelpers } from 'formik';
import { useEffect, useState } from 'react';
import { object, string } from 'yup';

import FlashMessageRender from '@/components/FlashMessageRender';
import ApiKeyModal from '@/components/dashboard/ApiKeyModal';
import ActionButton from '@/components/elements/ActionButton';
import Code from '@/components/elements/Code';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import Input from '@/components/elements/Input';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { Dialog } from '@/components/elements/dialog';

import createApiKey from '@/api/account/createApiKey';
import deleteApiKey from '@/api/account/deleteApiKey';
import getApiKeys, { ApiKey } from '@/api/account/getApiKeys';
import { httpErrorToHuman } from '@/api/http';

import i18n from '@/lib/i18n';

import { ApplicationStore } from '@/state';

import { useFlashKey } from '@/plugins/useFlash';

interface CreateValues {
    description: string;
    allowedIps: string;
}

const AccountApiContainer = () => {
    const [deleteIdentifier, setDeleteIdentifier] = useState('');
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

    const { clearAndAddHttpError } = useFlashKey('api-keys');
    const { addError, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    useEffect(() => {
        getApiKeys()
            .then((keys) => setKeys(keys))
            .then(() => setLoading(false))
            .catch((error) => clearAndAddHttpError(error));
    }, []);

    const doDeletion = (identifier: string) => {
        setLoading(true);
        clearAndAddHttpError();
        deleteApiKey(identifier)
            .then(() => setKeys((s) => [...(s || []).filter((key) => key.identifier !== identifier)]))
            .catch((error) => clearAndAddHttpError(error))
            .then(() => {
                setLoading(false);
                setDeleteIdentifier('');
            });
    };

    const submitCreate = (values: CreateValues, { setSubmitting, resetForm }: FormikHelpers<CreateValues>) => {
        clearFlashes('account:api-keys');
        createApiKey(values.description, values.allowedIps)
            .then(({ secretToken, ...key }) => {
                resetForm();
                setSubmitting(false);
                setApiKey(`${key.identifier}${secretToken}`);
                setKeys((s) => [...s!, key]);
                setShowCreateModal(false);
            })
            .catch((error) => {
                console.error(error);
                addError({ key: 'account:api-keys', message: httpErrorToHuman(error) });
                setSubmitting(false);
            });
    };

    const toggleKeyVisibility = (identifier: string) => {
        setShowKeys((prev) => ({
            ...prev,
            [identifier]: !prev[identifier],
        }));
    };

    return (
        <PageContentBlock title={i18n.t('dashboard:api_keys.title')}>
            <FlashMessageRender byKey='account:api-keys' />
            <ApiKeyModal visible={apiKey.length > 0} onModalDismissed={() => setApiKey('')} apiKey={apiKey} />

            {/* Create API Key Modal */}
            {showCreateModal && (
                <Dialog.Confirm
                    open={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    title={i18n.t('dashboard:api_keys.create_title')}
                    confirm={i18n.t('dashboard:api_keys.create_confirm')}
                    onConfirmed={() => {
                        const form = document.getElementById('create-api-form') as HTMLFormElement;
                        if (form) {
                            const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
                            if (submitButton) submitButton.click();
                        }
                    }}
                >
                    <Formik
                        onSubmit={submitCreate}
                        initialValues={{ description: '', allowedIps: '' }}
                        validationSchema={object().shape({
                            allowedIps: string(),
                            description: string()
                                .required(i18n.t('strings.validation.required')),
                        })}
                    >
                        {({ isSubmitting }) => (
                            <Form id='create-api-form' className='space-y-4'>
                                <SpinnerOverlay visible={isSubmitting} />

                                <FormikFieldWrapper
                                    label={i18n.t('dashboard:api_keys.description_label')}
                                    name='description'
                                    description={i18n.t('dashboard:api_keys.description_help')}
                                >
                                    <Field name='description' as={Input} className='w-full' />
                                </FormikFieldWrapper>

                                <FormikFieldWrapper
                                    label={i18n.t('dashboard:api_keys.ips_label')}
                                    name='allowedIps'
                                    description={i18n.t('dashboard:api_keys.ips_help')}
                                >
                                    <Field name='allowedIps' as={Input} className='w-full' />
                                </FormikFieldWrapper>

                                <button type='submit' className='hidden' />
                            </Form>
                        )}
                    </Formik>
                </Dialog.Confirm>
            )}

            <div className='w-full h-full min-h-full flex-1 flex flex-col px-2 sm:px-0'>
                <div
                    className='transform-gpu skeleton-anim-2 mb-3 sm:mb-4'
                    style={{
                        animationDelay: '50ms',
                        animationTimingFunction:
                            'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                    }}
                >
                    <MainPageHeader
                        title={i18n.t('dashboard:api_keys.title')}
                        titleChildren={
                            <ActionButton
                                variant='primary'
                                onClick={() => setShowCreateModal(true)}
                                className='flex items-center gap-2'
                            >
                                <Plus width={22} height={22} fill='currentColor' />
                                {i18n.t('dashboard:api_keys.create_button')}
                            </ActionButton>
                        }
                    />
                </div>

                <div
                    className='transform-gpu skeleton-anim-2'
                    style={{
                        animationDelay: '75ms',
                        animationTimingFunction:
                            'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                    }}
                >
                    <div className='bg-gradient-to-b from-[#ffffff08] to-[#ffffff05] border-[1px] border-[#ffffff12] rounded-xl p-4 sm:p-6 shadow-sm'>
                        <SpinnerOverlay visible={loading} />
                        <Dialog.Confirm
                            title={i18n.t('dashboard:api_keys.delete_title')}
                            confirm={i18n.t('dashboard:api_keys.delete_confirm')}
                            open={!!deleteIdentifier}
                            onClose={() => setDeleteIdentifier('')}
                            onConfirmed={() => doDeletion(deleteIdentifier)}
                        >
                            {i18n.t('dashboard:api_keys.delete_warning', { key: deleteIdentifier })}
                        </Dialog.Confirm>

                        {keys.length === 0 ? (
                            <div className='text-center py-12'>
                                <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-[#ffffff11] flex items-center justify-center'>
                                    <Key width={22} height={22} className='text-zinc-400' fill='currentColor' />
                                </div>
                                <h3 className='text-lg font-medium text-zinc-200 mb-2'>
                                    {i18n.t('dashboard:api_keys.empty_title')}
                                </h3>
                                <p className='text-sm text-zinc-400 max-w-sm mx-auto'>
                                    {loading
                                        ? i18n.t('dashboard:api_keys.loading')
                                        : i18n.t('dashboard:api_keys.empty_description')}
                                </p>
                            </div>
                        ) : (
                            <div className='space-y-3'>
                                {keys.map((key, index) => (
                                    <div
                                        key={key.identifier}
                                        className='transform-gpu skeleton-anim-2'
                                        style={{
                                            animationDelay: `${index * 25 + 100}ms`,
                                            animationTimingFunction:
                                                'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                                        }}
                                    >
                                        <div className='bg-[#ffffff05] border-[1px] border-[#ffffff08] rounded-lg p-4 hover:border-[#ffffff15] transition-all duration-150'>
                                            <div className='flex items-center justify-between'>
                                                <div className='flex-1 min-w-0'>
                                                    <div className='flex items-center gap-3 mb-2'>
                                                        <h4 className='text-sm font-medium text-zinc-100 truncate'>
                                                            {key.description}
                                                        </h4>
                                                    </div>
                                                    <div className='flex items-center gap-4 text-xs text-zinc-400'>
                                                        <span>
                                                            {i18n.t('dashboard:api_keys.last_used')}{' '}
                                                            {key.lastUsedAt
                                                                ? format(key.lastUsedAt, 'MMM d, yyyy HH:mm', { locale: i18n.language === 'es' ? es : undefined })
                                                                : i18n.t('dashboard:api_keys.never')}
                                                        </span>
                                                        <div className='flex items-center gap-2'>
                                                            <span>{i18n.t('dashboard:api_keys.key_label')}</span>
                                                            <code className='font-mono px-2 py-1 bg-[#ffffff08] border border-[#ffffff08] rounded text-zinc-300'>
                                                                {showKeys[key.identifier]
                                                                    ? key.identifier
                                                                    : '••••••••••••••••'}
                                                            </code>
                                                            <ActionButton
                                                                variant='secondary'
                                                                size='sm'
                                                                onClick={() => toggleKeyVisibility(key.identifier)}
                                                                className='p-1 text-zinc-400 hover:text-zinc-300'
                                                            >
                                                                {showKeys[key.identifier] ? (
                                                                    <EyeSlash
                                                                        width={18}
                                                                        height={18}
                                                                        fill='currentColor'
                                                                    />
                                                                ) : (
                                                                    <Eye width={18} height={18} fill='currentColor' />
                                                                )}
                                                            </ActionButton>
                                                        </div>
                                                    </div>
                                                </div>
                                                <ActionButton
                                                    variant='danger'
                                                    size='sm'
                                                    className='ml-4'
                                                    onClick={() => setDeleteIdentifier(key.identifier)}
                                                >
                                                    <TrashBin width={20} height={20} fill='currentColor' />
                                                </ActionButton>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageContentBlock>
    );
};

export default AccountApiContainer;
