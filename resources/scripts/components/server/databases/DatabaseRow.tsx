import { Database, Eye, TrashBin } from '@gravity-ui/icons';
import { Form, Formik, type FormikHelpers } from 'formik';
import { useState } from 'react';
import styled from 'styled-components';
import { object, string } from 'yup';
import { httpErrorToHuman } from '@/api/http';
import deleteServerDatabase from '@/api/server/databases/deleteServerDatabase';
import type { ServerDatabase } from '@/api/server/databases/getServerDatabases';
import ActionButton from '@/components/elements/ActionButton';
import Can from '@/components/elements/Can';
import CopyOnClick from '@/components/elements/CopyOnClick';
import Field from '@/components/elements/Field';
import Input from '@/components/elements/Input';
import Modal from '@/components/elements/Modal';
import { PageListItem } from '@/components/elements/pages/PageList';
import Spinner from '@/components/elements/Spinner';
import FlashMessageRender from '@/components/FlashMessageRender';
import RotatePasswordButton from '@/components/server/databases/RotatePasswordButton';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';

const Label = styled.label`
    display: inline-block;
    color: #ffffff77;
    font-size: 0.875rem;
    padding-bottom: 0.5rem;
`;

interface Props {
    database: ServerDatabase;
}

const DatabaseRow = ({ database }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const { addError, clearFlashes } = useFlash();
    const [visible, setVisible] = useState(false);
    const [connectionVisible, setConnectionVisible] = useState(false);

    const appendDatabase = ServerContext.useStoreActions((actions) => actions.databases.appendDatabase);
    const removeDatabase = ServerContext.useStoreActions((actions) => actions.databases.removeDatabase);

    const jdbcConnectionString = `jdbc:mysql://${database.username}${database.password ? `:${encodeURIComponent(database.password)}` : ''}@${database.connectionString}/${database.name}`;

    const schema = object().shape({
        confirm: string()
            .required('The database name must be provided.')
            .oneOf([database.name.split('_', 2)[1] || '', database.name], 'The database name must be provided.'),
    });

    const submit = (_: { confirm: string }, { setSubmitting, resetForm }: FormikHelpers<{ confirm: string }>) => {
        clearFlashes();
        deleteServerDatabase(uuid, database.id)
            .then(() => {
                resetForm();
                setVisible(false);
                setTimeout(() => removeDatabase(database.id), 150);
                setSubmitting(false);
            })
            .catch((error) => {
                resetForm();
                console.error(error);
                setSubmitting(false);
                addError({
                    key: 'database:delete',
                    message: httpErrorToHuman(error),
                });
            });
    };

    return (
        <>
            <Formik initialValues={{ confirm: '' }} isInitialValid={false} onSubmit={submit} validationSchema={schema}>
                {({ isSubmitting, isValid, resetForm }) => (
                    <Modal
                        dismissable={!isSubmitting}
                        onDismissed={() => {
                            setVisible(false);
                            resetForm();
                        }}
                        showSpinnerOverlay={isSubmitting}
                        title='Confirm database deletion'
                        visible={visible}
                    >
                        <FlashMessageRender byKey={'database:delete'} />
                        <div className='flex flex-col'>
                            <p>
                                Deleting a database is a permanent action, it cannot be undone. This will permanently
                                delete the <strong>{database.name}</strong> database and remove all its data.
                            </p>
                            <Form className='mt-6'>
                                <Field
                                    description={'Enter the database name to confirm deletion.'}
                                    id={'confirm_name'}
                                    label={'Confirm Database Name'}
                                    name={'confirm'}
                                    type={'text'}
                                />
                                <ActionButton
                                    className='my-6 min-w-full'
                                    disabled={!isValid || isSubmitting}
                                    type={'submit'}
                                    variant='danger'
                                >
                                    {isSubmitting && <Spinner size='small' />}
                                    {isSubmitting ? 'Deleting...' : 'Delete Database'}
                                </ActionButton>
                            </Form>
                        </div>
                    </Modal>
                )}
            </Formik>

            <Modal
                closeButton={true}
                onDismissed={() => setConnectionVisible(false)}
                title='Database connection details'
                visible={connectionVisible}
            >
                <FlashMessageRender byKey={'database-connection-modal'} />
                <div className='flex min-w-full flex-col gap-4'>
                    <div className='grid min-w-full gap-4 sm:grid-cols-2'>
                        <div className='flex flex-col'>
                            <Label>Endpoint</Label>
                            <CopyOnClick text={database.connectionString}>
                                <Input readOnly type={'text'} value={database.connectionString} />
                            </CopyOnClick>
                        </div>
                        <div className='flex flex-col'>
                            <Label>Connections from</Label>
                            <CopyOnClick text={database.allowConnectionsFrom}>
                                <Input readOnly type={'text'} value={database.allowConnectionsFrom} />
                            </CopyOnClick>
                        </div>
                        <div className='flex flex-col'>
                            <Label>Username</Label>
                            <CopyOnClick text={database.username}>
                                <Input readOnly type={'text'} value={database.username} />
                            </CopyOnClick>
                        </div>
                        <Can action={'database.view_password'}>
                            <div className='flex flex-col'>
                                <Label>Password</Label>
                                <div className='flex min-w-full flex-row gap-2'>
                                    <CopyOnClick showInNotification={false} text={database.password}>
                                        <Input
                                            className='flex-auto'
                                            readOnly
                                            type={'password'}
                                            value={database.password}
                                        />
                                    </CopyOnClick>
                                    <Can action={'database.update'}>
                                        <RotatePasswordButton databaseId={database.id} onUpdate={appendDatabase} />
                                    </Can>
                                </div>
                            </div>
                        </Can>
                    </div>
                    <div className='flex flex-col'>
                        <div className='flex flex-row items-center gap-2 align-middle'>
                            <Label>JDBC Connection String</Label>
                        </div>
                        <CopyOnClick showInNotification={false} text={jdbcConnectionString}>
                            <Input readOnly type={'password'} value={jdbcConnectionString} />
                        </CopyOnClick>
                    </div>
                </div>
            </Modal>

            <PageListItem>
                <div className='flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                    <div className='min-w-0 flex-1'>
                        <div className='mb-2 flex items-center gap-3'>
                            <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#ffffff11]'>
                                <Database className='h-4 w-4 text-zinc-400' fill='currentColor' />
                            </div>
                            <div className='min-w-0 flex-1'>
                                <CopyOnClick text={database.name}>
                                    <h3 className='truncate font-medium text-base text-zinc-100'>{database.name}</h3>
                                </CopyOnClick>
                            </div>
                        </div>

                        <div className='grid grid-cols-1 gap-3 text-sm sm:grid-cols-3'>
                            <div>
                                <p className='mb-1 text-xs text-zinc-500 uppercase tracking-wide'>Endpoint</p>
                                <CopyOnClick text={database.connectionString}>
                                    <p className='truncate font-mono text-zinc-300'>{database.connectionString}</p>
                                </CopyOnClick>
                            </div>
                            <div>
                                <p className='mb-1 text-xs text-zinc-500 uppercase tracking-wide'>From</p>
                                <CopyOnClick text={database.allowConnectionsFrom}>
                                    <p className='truncate font-mono text-zinc-300'>{database.allowConnectionsFrom}</p>
                                </CopyOnClick>
                            </div>
                            <div>
                                <p className='mb-1 text-xs text-zinc-500 uppercase tracking-wide'>Username</p>
                                <CopyOnClick text={database.username}>
                                    <p className='truncate font-mono text-zinc-300'>{database.username}</p>
                                </CopyOnClick>
                            </div>
                        </div>
                    </div>

                    <div className='flex items-center gap-2 sm:flex-col sm:gap-3'>
                        <ActionButton
                            className='flex items-center gap-2'
                            onClick={() => setConnectionVisible(true)}
                            size='sm'
                            variant='secondary'
                        >
                            <Eye className='h-4 w-4' fill='currentColor' />
                            <span className='hidden sm:inline'>Details</span>
                        </ActionButton>
                        <Can action={'database.delete'}>
                            <ActionButton
                                className='flex items-center gap-2'
                                onClick={() => setVisible(true)}
                                size='sm'
                                variant='danger'
                            >
                                <TrashBin className='h-4 w-4' fill='currentColor' />
                                <span className='hidden sm:inline'>Delete</span>
                            </ActionButton>
                        </Can>
                    </div>
                </div>
            </PageListItem>
        </>
    );
};

export default DatabaseRow;
