import { Eye, EyeSlash, Key, Plus, TrashBin } from '@gravity-ui/icons';
import { format } from 'date-fns';
import { type Actions, useStoreActions } from 'easy-peasy';
import { Field, Form, Formik, type FormikHelpers } from 'formik';
import { useEffect, useState } from 'react';
import { object, string } from 'yup';
import { createSSHKey, deleteSSHKey, useSSHKeys } from '@/api/account/ssh-keys';
import { httpErrorToHuman } from '@/api/http';
import Code from '@/components/elements/Code';
import CopyOnClick from '@/components/elements/CopyOnClick';
import { Dialog } from '@/components/elements/dialog';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import Input from '@/components/elements/Input';
import PageContentBlock from '@/components/elements/PageContentBlock';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import FlashMessageRender from '@/components/FlashMessageRender';
import ServerHeader from '@/components/HeaderManger';
import { Button } from '@/components/ui/button';
import { useFlashKey } from '@/plugins/useFlash';
import type { ApplicationStore } from '@/state';

interface CreateValues {
    name: string;
    publicKey: string;
}

const AccountSSHContainer = () => {
    const [deleteKey, setDeleteKey] = useState<{
        name: string;
        fingerprint: string;
    } | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

    const { clearAndAddHttpError } = useFlashKey('account:ssh-keys');
    const { addError, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);
    const { data, isValidating, error, mutate } = useSSHKeys({
        revalidateOnMount: true,
        revalidateOnFocus: false,
    });

    useEffect(() => {
        clearAndAddHttpError(error);
    }, [error]);

    const doDeletion = () => {
        if (!deleteKey) return;

        clearAndAddHttpError();
        Promise.all([
            mutate((data) => data?.filter((value) => value.fingerprint !== deleteKey.fingerprint), false),
            deleteSSHKey(deleteKey.fingerprint),
        ])
            .catch((error) => {
                mutate(undefined, true).catch(console.error);
                clearAndAddHttpError(error);
            })
            .finally(() => {
                setDeleteKey(null);
            });
    };

    const submitCreate = (values: CreateValues, { setSubmitting, resetForm }: FormikHelpers<CreateValues>) => {
        clearFlashes('account:ssh-keys');
        createSSHKey(values.name, values.publicKey)
            .then((key) => {
                resetForm();
                setSubmitting(false);
                mutate((data) => (data || []).concat(key));
                setShowCreateModal(false);
            })
            .catch((error) => {
                console.error(error);
                addError({ key: 'account:ssh-keys', message: httpErrorToHuman(error) });
                setSubmitting(false);
            });
    };

    const toggleKeyVisibility = (fingerprint: string) => {
        setShowKeys((prev) => ({
            ...prev,
            [fingerprint]: !prev[fingerprint],
        }));
    };

    return (
        <PageContentBlock title={'SSH Keys'}>
            <FlashMessageRender byKey='account:ssh-keys' />
            <ServerHeader title='SSH Keys' />

            {/* Create SSH Key Modal */}
            {showCreateModal && (
                <Dialog.Confirm
                    confirm='Add Key'
                    onClose={() => setShowCreateModal(false)}
                    onConfirmed={() => {
                        const form = document.getElementById('create-ssh-form') as HTMLFormElement;
                        if (form) {
                            const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
                            if (submitButton) submitButton.click();
                        }
                    }}
                    open={showCreateModal}
                    title='Add SSH Key'
                >
                    <Formik
                        initialValues={{ name: '', publicKey: '' }}
                        onSubmit={submitCreate}
                        validationSchema={object().shape({
                            name: string().required('SSH Key Name is required'),
                            publicKey: string().required('Public Key is required'),
                        })}
                    >
                        {({ isSubmitting }) => (
                            <Form className='space-y-4' id='create-ssh-form'>
                                <SpinnerOverlay visible={isSubmitting} />

                                <FormikFieldWrapper
                                    description='A name to identify this SSH key.'
                                    label='SSH Key Name'
                                    name='name'
                                >
                                    <Field as={Input} className='w-full' name='name' />
                                </FormikFieldWrapper>

                                <FormikFieldWrapper
                                    description='Enter your public SSH key.'
                                    label='Public Key'
                                    name='publicKey'
                                >
                                    <Field as={Input} className='w-full' name='publicKey' />
                                </FormikFieldWrapper>

                                <button className='hidden' type='submit' />
                            </Form>
                        )}
                    </Formik>
                </Dialog.Confirm>
            )}

            <div className='flex h-full min-h-full w-full flex-1 flex-col px-2 sm:px-0'>
                <div
                    className='skeleton-anim-2 mb-3 transform-gpu sm:mb-4'
                    style={{
                        animationDelay: '50ms',
                        animationTimingFunction:
                            'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                    }}
                />

                <div
                    className='skeleton-anim-2 transform-gpu'
                    style={{
                        animationDelay: '75ms',
                        animationTimingFunction:
                            'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                    }}
                >
                    <div className='rounded-xl p-6 shadow-sm md:p-4'>
                        <SpinnerOverlay visible={!data && isValidating} />
                        <Dialog.Confirm
                            confirm={'Delete Key'}
                            onClose={() => setDeleteKey(null)}
                            onConfirmed={doDeletion}
                            open={!!deleteKey}
                            title={'Delete SSH Key'}
                        >
                            Removing the <Code>{deleteKey?.name}</Code> SSH key will invalidate its usage across the
                            Panel.
                        </Dialog.Confirm>
                        <div className='mb-4'>
                            <Button
                                className='flex items-center gap-2'
                                onClick={() => setShowCreateModal(true)}
                                variant='secondary'
                            >
                                <Plus fill='currentColor' height={22} width={22} />
                                Add SSH Key
                            </Button>
                        </div>

                        {!data || data.length === 0 ? (
                            <div className='py-12 text-center'>
                                <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#ffffff11]'>
                                    <Key className='text-zinc-400' fill='currentColor' height={22} width={22} />
                                </div>
                                <h3 className='mb-2 font-medium text-lg text-zinc-200'>No SSH Keys</h3>
                                <p className='mx-auto max-w-sm text-sm text-zinc-400'>
                                    {data
                                        ? "You haven't added any SSH keys yet. Add one to securely access your servers."
                                        : 'Loading your SSH keys...'}
                                </p>
                            </div>
                        ) : (
                            <div className='space-y-3'>
                                {data.map((key, index) => (
                                    <div
                                        className='skeleton-anim-2 transform-gpu'
                                        key={key.fingerprint}
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
                                                        <h4 className='truncate font-medium text-sm text-zinc-100'>
                                                            {key.name}
                                                        </h4>
                                                    </div>
                                                    <div className='flex items-center gap-4 text-xs text-zinc-400'>
                                                        <span>Added: {format(key.createdAt, 'MMM d, yyyy HH:mm')}</span>
                                                        <div className='flex items-center gap-2'>
                                                            <span>Fingerprint:</span>
                                                            <code className='flex gap-1 rounded border border-mocha-200 bg-mocha-400 px-2 py-1 font-mono text-zinc-300'>
                                                                {showKeys[key.fingerprint] ? (
                                                                    <EyeSlash
                                                                        className='hover:cursor-pointer'
                                                                        fill='currentColor'
                                                                        height={18}
                                                                        onClick={() =>
                                                                            toggleKeyVisibility(key.fingerprint)
                                                                        }
                                                                        width={18}
                                                                    />
                                                                ) : (
                                                                    <Eye
                                                                        className='hover:cursor-pointer'
                                                                        fill='currentColor'
                                                                        height={18}
                                                                        onClick={() =>
                                                                            toggleKeyVisibility(key.fingerprint)
                                                                        }
                                                                        width={18}
                                                                    />
                                                                )}
                                                                {showKeys[key.fingerprint] ? (
                                                                    <CopyOnClick text={key.fingerprint}>
                                                                        <span>SHA256:${key.fingerprint}</span>
                                                                    </CopyOnClick>
                                                                ) : (
                                                                    'SHA256:••••••••••••••••'
                                                                )}
                                                            </code>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    className='ml-4'
                                                    onClick={() =>
                                                        setDeleteKey({
                                                            name: key.name,
                                                            fingerprint: key.fingerprint,
                                                        })
                                                    }
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

export default AccountSSHContainer;
