import { Database } from '@gravity-ui/icons';
import { Form, Formik, FormikHelpers } from 'formik';
import { For } from 'million/react';
import { useEffect, useState } from 'react';
import { object, string } from 'yup';

import FlashMessageRender from '@/components/FlashMessageRender';
import ActionButton from '@/components/elements/ActionButton';
import Can from '@/components/elements/Can';
import Field from '@/components/elements/Field';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import Modal from '@/components/elements/Modal';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { PageListContainer, PageListItem } from '@/components/elements/pages/PageList';
import DatabaseRow from '@/components/server/databases/DatabaseRow';

import i18n from '@/lib/i18n';
import { httpErrorToHuman } from '@/api/http';
import createServerDatabase from '@/api/server/databases/createServerDatabase';
import getServerDatabases from '@/api/server/databases/getServerDatabases';

import { ServerContext } from '@/state/server';

import { useDeepMemoize } from '@/plugins/useDeepMemoize';
import useFlash from '@/plugins/useFlash';

interface DatabaseValues {
    databaseName: string;
    connectionsFrom: string;
}

const databaseSchema = object().shape({
    databaseName: string()
        .required(i18n.t('server:databases.name_required'))
        .min(3, i18n.t('server:databases.name_min'))
        .max(48, i18n.t('server:databases.name_max'))
        .matches(/^[\w\-.]{3,48}$/, i18n.t('server:databases.name_regex')),
    connectionsFrom: string().matches(/^[\w\-/.%:]+$/, i18n.t('server:databases.host_required')),
});

const DatabasesContainer = () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const databaseLimit = ServerContext.useStoreState((state) => state.server.data!.featureLimits.databases);

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
    }, []);

    return (
        <ServerContentBlock title={i18n.t('server:databases.title')}>
            <FlashMessageRender byKey={'databases'} />
            <MainPageHeader
                direction='column'
                title={i18n.t('server:databases.header')}
                titleChildren={
                    <Can action={'database.create'}>
                        <div className='flex flex-col sm:flex-row items-center justify-end gap-4'>
                            {databaseLimit === null && (
                                <p className='text-sm text-zinc-300 text-center sm:text-right'>
                                    {i18n.t('server:databases.count', { count: databases.length })}
                                </p>
                            )}
                            {databaseLimit > 0 && (
                                <p className='text-sm text-zinc-300 text-center sm:text-right'>
                                    {i18n.t('server:databases.count_limited', { count: databases.length, limit: databaseLimit })}
                                </p>
                            )}
                            {databaseLimit === 0 && (
                                <p className='text-sm text-red-400 text-center sm:text-right'>{i18n.t('server:databases.disabled')}</p>
                            )}
                            {(databaseLimit === null || (databaseLimit > 0 && databaseLimit !== databases.length)) && (
                                <ActionButton variant='primary' onClick={() => setCreateModalVisible(true)}>
                                    {i18n.t('server:databases.new_button')}
                                </ActionButton>
                            )}
                        </div>
                    </Can>
                }
            >
                <p className='text-sm text-neutral-400 leading-relaxed'>
                    {i18n.t('server:databases.description')}
                </p>
            </MainPageHeader>

            <Formik
                onSubmit={submitDatabase}
                initialValues={{ databaseName: '', connectionsFrom: '' }}
                validationSchema={databaseSchema}
            >
                {({ isSubmitting, resetForm }) => (
                    <Modal
                        visible={createModalVisible}
                        dismissable={!isSubmitting}
                        showSpinnerOverlay={isSubmitting}
                        onDismissed={() => {
                            resetForm();
                            setCreateModalVisible(false);
                        }}
                        title={i18n.t('server:databases.create_title')}
                    >
                        <div className='flex flex-col'>
                            <FlashMessageRender byKey={'database:create'} />
                            <Form>
                                <Field
                                    type={'string'}
                                    id={'database_name'}
                                    name={'databaseName'}
                                    label={i18n.t('server:databases.name_label')}
                                    description={i18n.t('server:databases.name_help')}
                                />
                                <div className={`mt-6`}>
                                    <Field
                                        type={'string'}
                                        id={'connections_from'}
                                        name={'connectionsFrom'}
                                        label={i18n.t('server:databases.connections_label')}
                                        description={i18n.t('server:databases.connections_help')}
                                    />
                                </div>
                                <div className={`flex gap-3 justify-end my-6`}>
                                    <ActionButton variant='primary' type={'submit'}>
                                        {i18n.t('server:databases.create_button')}
                                    </ActionButton>
                                </div>
                            </Form>
                        </div>
                    </Modal>
                )}
            </Formik>

            {!databases.length && loading ? (
                <div className='flex items-center justify-center py-12'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-brand'></div>
                </div>
            ) : databases.length > 0 ? (
                <PageListContainer data-pyro-databases>
                    <For each={databases} memo>
                        {(database, index) => <DatabaseRow key={database.id} database={database} />}
                    </For>
                </PageListContainer>
            ) : (
                <div className='flex flex-col items-center justify-center min-h-[60vh] py-12 px-4'>
                    <div className='text-center'>
                        <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-[#ffffff11] flex items-center justify-center'>
                            <Database className='w-8 h-8 text-zinc-400' fill='currentColor' />
                        </div>
                        <h3 className='text-lg font-medium text-zinc-200 mb-2'>
                            {databaseLimit === 0 ? i18n.t('server:databases.unavailable') : i18n.t('server:databases.empty')}
                        </h3>
                        <p className='text-sm text-zinc-400 max-w-sm'>
                            {databaseLimit === 0
                                ? i18n.t('server:databases.unavailable_description')
                                : i18n.t('server:databases.empty_description')}
                        </p>
                    </div>
                </div>
            )}
        </ServerContentBlock>
    );
};

export default DatabasesContainer;
