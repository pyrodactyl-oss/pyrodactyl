import { Database } from '@gravity-ui/icons';
import { Form, Formik, type FormikHelpers } from 'formik';
import { For } from 'million/react';
import { useEffect, useState } from 'react';
import { object, string } from 'yup';
import { httpErrorToHuman } from '@/api/http';
import createServerDatabase from '@/api/server/databases/createServerDatabase';
import getServerDatabases from '@/api/server/databases/getServerDatabases';
import ActionButton from '@/components/elements/ActionButton';
import Can from '@/components/elements/Can';
import Field from '@/components/elements/Field';
import Modal from '@/components/elements/Modal';
import { PageListContainer } from '@/components/elements/pages/PageList';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import FlashMessageRender from '@/components/FlashMessageRender';
import DatabaseRow from '@/components/server/databases/DatabaseRow';
import ServerHeader from '@/components/server/header/ServerHeader';
import { useDeepMemoize } from '@/plugins/useDeepMemoize';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';

interface DatabaseValues {
    connectionsFrom: string;
    databaseName: string;
}

const databaseSchema = object().shape({
    databaseName: string()
        .required('A database name must be provided.')
        .min(3, 'Database name must be at least 3 characters.')
        .max(48, 'Database name must not exceed 48 characters.')
        .matches(
            /^[\w\-.]{3,48}$/,
            'Database name should only contain alphanumeric characters, underscores, dashes, and/or periods.',
        ),
    connectionsFrom: string().matches(/^[\w\-/.%:]+$/, 'A valid host address must be provided.'),
});

const DatabasesContainer = () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const databaseLimit = ServerContext.useStoreState((state) => state.server.data?.featureLimits.databases);

    const { addError, clearFlashes } = useFlash();
    const [loading, setLoading] = useState(true);
    const [createModalVisible, setCreateModalVisible] = useState(false);

    const databases = useDeepMemoize(ServerContext.useStoreState((state) => state.databases.data));
    const setDatabases = ServerContext.useStoreActions((state) => state.databases.setDatabases);
    const appendDatabase = ServerContext.useStoreActions((actions) => actions.databases.appendDatabase);

    const submitDatabase = (values: DatabaseValues, { setSubmitting, resetForm }: FormikHelpers<DatabaseValues>) => {
        clearFlashes('database:create');
        createServerDatabase(uuid, {
            databaseName: values.databaseName,
            connectionsFrom: values.connectionsFrom || '%',
        })
            .then((database) => {
                resetForm();
                appendDatabase(database);
                setSubmitting(false);
                setCreateModalVisible(false);
            })
            .catch((error) => {
                addError({ key: 'database:create', message: httpErrorToHuman(error) });
                setSubmitting(false);
            });
    };

    useEffect(() => {
        setLoading(!databases.length);
        clearFlashes('databases');

        getServerDatabases(uuid)
            .then((databases) => setDatabases(databases))
            .catch((error) => {
                console.error(error);
                addError({ key: 'databases', message: httpErrorToHuman(error) });
            })
            .then(() => setLoading(false));
    }, [clearFlashes, uuid, setDatabases, databases.length, addError]);

    return (
        <ServerContentBlock showFlashKey={'databases'} title={'Databases'}>
            <ServerHeader />
            <Can action={'database.create'}>
                <div className='flex flex-col items-center justify-end gap-4 sm:flex-row'>
                    {databaseLimit === null && (
                        <p className='text-center text-sm text-zinc-300 sm:text-right'>
                            {databases.length} databases (unlimited)
                        </p>
                    )}
                    {databaseLimit > 0 && (
                        <p className='text-center text-sm text-zinc-300 sm:text-right'>
                            {databases.length} of {databaseLimit} databases
                        </p>
                    )}
                    {databaseLimit === 0 && (
                        <p className='text-center text-red-400 text-sm sm:text-right'>Databases disabled</p>
                    )}
                    {(databaseLimit === null || (databaseLimit > 0 && databaseLimit !== databases.length)) && (
                        <ActionButton onClick={() => setCreateModalVisible(true)} variant='secondary'>
                            New Database
                        </ActionButton>
                    )}
                </div>
            </Can>
            <Formik
                initialValues={{ databaseName: '', connectionsFrom: '' }}
                onSubmit={submitDatabase}
                validationSchema={databaseSchema}
            >
                {({ isSubmitting, resetForm }) => (
                    <Modal
                        dismissable={!isSubmitting}
                        onDismissed={() => {
                            resetForm();
                            setCreateModalVisible(false);
                        }}
                        showSpinnerOverlay={isSubmitting}
                        title='Create new database'
                        visible={createModalVisible}
                    >
                        <div className='flex flex-col'>
                            <FlashMessageRender byKey={'database:create'} />
                            <Form>
                                <Field
                                    description={'A descriptive name for your database instance.'}
                                    id={'database_name'}
                                    label={'Database Name'}
                                    name={'databaseName'}
                                    type={'string'}
                                />
                                <div className={'mt-6'}>
                                    <Field
                                        description={
                                            'Where connections should be allowed from. Leave blank to allow connections from anywhere.'
                                        }
                                        id={'connections_from'}
                                        label={'Connections From'}
                                        name={'connectionsFrom'}
                                        type={'string'}
                                    />
                                </div>
                                <div className={'my-6 flex justify-end gap-3'}>
                                    <ActionButton type={'submit'} variant='primary'>
                                        Create Database
                                    </ActionButton>
                                </div>
                            </Form>
                        </div>
                    </Modal>
                )}
            </Formik>

            {!databases.length && loading ? (
                <div className='flex items-center justify-center py-12'>
                    <div className='h-8 w-8 animate-spin rounded-full border-brand border-b-2' />
                </div>
            ) : databases.length > 0 ? (
                <PageListContainer data-pyro-databases>
                    <For each={databases} memo>
                        {(database, _index) => <DatabaseRow database={database} key={database.id} />}
                    </For>
                </PageListContainer>
            ) : (
                <div className='flex min-h-[60vh] flex-col items-center justify-center px-4 py-12'>
                    <div className='text-center'>
                        <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#ffffff11]'>
                            <Database className='h-8 w-8 text-zinc-400' fill='currentColor' />
                        </div>
                        <h3 className='mb-2 font-medium text-lg text-zinc-200'>
                            {databaseLimit === 0 ? 'Databases unavailable' : 'No databases found'}
                        </h3>
                        <p className='max-w-sm text-sm text-zinc-400'>
                            {databaseLimit === 0
                                ? 'Databases cannot be created for this server.'
                                : 'Your server does not have any databases. Create one to get started.'}
                        </p>
                    </div>
                </div>
            )}
        </ServerContentBlock>
    );
};

export default DatabasesContainer;
