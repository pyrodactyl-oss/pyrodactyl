import { Eye, EyeSlash, Key, Plus, TrashBin } from '@gravity-ui/icons';
import { format } from 'date-fns';
import { type Actions, useStoreActions } from 'easy-peasy';
import type { FormikHelpers } from 'formik';
import { lazy, useEffect, useState } from 'react';
import createApiKey from '@/api/account/createApiKey';
import deleteApiKey from '@/api/account/deleteApiKey';
import getApiKeys, { type ApiKey } from '@/api/account/getApiKeys';
import { httpErrorToHuman } from '@/api/http';
import ApiKeyModal from '@/components/dashboard/ApiKeyModal';
import Code from '@/components/elements/Code';
import CopyOnClick from '@/components/elements/CopyOnClick';
import { Dialog } from '@/components/elements/dialog';
import PageContentBlock from '@/components/elements/PageContentBlock';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import FlashMessageRender from '@/components/FlashMessageRender';
import { Button } from '@/components/ui/button';
import { useFlashKey } from '@/plugins/useFlash';
import type { ApplicationStore } from '@/state';
import ServerHeader from '../HeaderManger';

const CreateApiKeyModal = lazy(() => import('./CreateApiKeyModal'));

interface CreateValues {
    allowedIps: string;
    description: string;
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
    }, [clearAndAddHttpError]);

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
        <PageContentBlock title={'Api Key'}>
            <FlashMessageRender byKey='account:api-keys' />
            <ApiKeyModal apiKey={apiKey} onModalDismissed={() => setApiKey('')} visible={apiKey.length > 0} />
            <ServerHeader title='Api Keys' />

            <CreateApiKeyModal
                onClose={() => setShowCreateModal(false)}
                onSubmit={submitCreate}
                open={showCreateModal}
            />

            <div className='flex h-full min-h-full w-full flex-1 flex-col px-2 sm:px-0'>
                <div
                    className='skeleton-anim-2 transform-gpu'
                    style={{
                        animationDelay: '75ms',
                        animationTimingFunction:
                            'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                    }}
                >
                    <div className='rounded-xl p-4 shadow-sm sm:p-6'>
                        <SpinnerOverlay visible={loading} />
                        <Dialog.Confirm
                            confirm={'Delete Key'}
                            onClose={() => setDeleteIdentifier('')}
                            onConfirmed={() => doDeletion(deleteIdentifier)}
                            open={!!deleteIdentifier}
                            title={'Delete API Key'}
                        >
                            All requests using the <Code>{deleteIdentifier}</Code> key will be invalidated.
                        </Dialog.Confirm>
                        <div className='mb-4'>
                            <Button
                                className='flex items-center gap-2'
                                onClick={() => setShowCreateModal(true)}
                                variant='secondary'
                            >
                                <Plus fill='currentColor' height={22} width={22} />
                                Create API Key
                            </Button>
                        </div>

                        {keys.length === 0 ? (
                            <div className='py-12 text-center'>
                                <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-mocha-400'>
                                    <Key className='text-zinc-400' fill='currentColor' height={22} width={22} />
                                </div>
                                <h3 className='mb-2 font-medium text-lg text-zinc-200'>No API Keys</h3>
                                <p className='mx-auto max-w-sm text-sm text-zinc-400'>
                                    {loading
                                        ? 'Loading your API keys...'
                                        : "You haven't created any API keys yet. Create one to get started with the API."}
                                </p>
                            </div>
                        ) : (
                            <div className='space-y-3'>
                                {keys.map((key, index) => (
                                    <div
                                        className='skeleton-anim-2 transform-gpu'
                                        key={key.identifier}
                                        style={{
                                            animationDelay: `${index * 25 + 100}ms`,
                                            animationTimingFunction:
                                                'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                                        }}
                                    >
                                        <div className='rounded-lg border-[1px] border-mocha-300 bg-mocha-500 p-4 transition-all duration-150'>
                                            <div className='flex items-center justify-between'>
                                                <div className='min-w-0 flex-1'>
                                                    <div className='mb-2 flex items-center gap-3'>
                                                        <h4 className='truncate font-medium text-sm text-text'>
                                                            {key.description}
                                                        </h4>
                                                    </div>
                                                    <div className='flex items-center gap-4 font-large text-text/20 text-xs'>
                                                        <span>
                                                            Last used:{' '}
                                                            {key.lastUsedAt
                                                                ? format(key.lastUsedAt, 'MMM d, yyyy HH:mm')
                                                                : 'Never'}
                                                        </span>
                                                        <div className='flex items-center gap-2 hover:cursor-pointer'>
                                                            <span>Key:</span>

                                                            <code className='flex rounded border border-mocha-200 bg-mocha-400 px-2 py-1 font-mono text-zinc-300'>
                                                                <span className='flex items-center gap-1'>
                                                                    {showKeys[key.identifier] ? (
                                                                        <EyeSlash
                                                                            fill='currentColor'
                                                                            height={18}
                                                                            onClick={() =>
                                                                                toggleKeyVisibility(key.identifier)
                                                                            }
                                                                            width={18}
                                                                        />
                                                                    ) : (
                                                                        <Eye
                                                                            fill='currentColor'
                                                                            height={18}
                                                                            onClick={() =>
                                                                                toggleKeyVisibility(key.identifier)
                                                                            }
                                                                            width={18}
                                                                        />
                                                                    )}
                                                                    {showKeys[key.identifier] ? (
                                                                        <CopyOnClick text={key.identifier}>
                                                                            <pre>{key.identifier}</pre>
                                                                        </CopyOnClick>
                                                                    ) : (
                                                                        <span
                                                                            onClick={() =>
                                                                                toggleKeyVisibility(key.identifier)
                                                                            }
                                                                        >
                                                                            ••••••••••••••••
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            </code>
                                                        </div>
                                                    </div>
                                                </div>

                                                <Button
                                                    className='ml-4'
                                                    onClick={() => setDeleteIdentifier(key.identifier)}
                                                    size='sm'
                                                    variant='attention'
                                                >
                                                    <TrashBin fill='currentColor' height={20} width={20} />
                                                </Button>
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
