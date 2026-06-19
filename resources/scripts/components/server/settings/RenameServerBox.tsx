import { Actions, useStoreActions } from 'easy-peasy';
import { Form, Formik } from 'formik';
import { toast } from 'sonner';
import { object, string } from 'yup';

import i18n from '@/lib/i18n';

import ActionButton from '@/components/elements/ActionButton';
import Field from '@/components/elements/Field';
import TitledGreyBox from '@/components/elements/TitledGreyBox';

import { httpErrorToHuman } from '@/api/http';
import renameServer from '@/api/server/renameServer';

import { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';

interface Values {
    name: string;
    description: string;
}

const RenameServerForm = () => {
    return (
        <TitledGreyBox title={i18n.t('server:settings.server_details')}>
            <Form className='flex flex-col gap-4'>
                <Field id={'name'} name={'name'} label={i18n.t('server:settings.server_name')} type={'text'} />
                <Field id={'description'} name={'description'} label={i18n.t('server:settings.server_description')} type={'text'} />
                <div className={`mt-6 text-right`}>
                    <ActionButton variant='primary' type={'submit'}>
                        {i18n.t('server:settings.save')}
                    </ActionButton>
                </div>
            </Form>
        </TitledGreyBox>
    );
};

const RenameServerBox = () => {
    const server = ServerContext.useStoreState((state) => state.server.data!);
    const setServer = ServerContext.useStoreActions((actions) => actions.server.setServer);
    const { addError, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const submit = ({ name, description }: Values) => {
        clearFlashes('settings');
        toast(i18n.t('server:settings.updating_toast'));
        renameServer(server.uuid, name, description)
            .then(() => setServer({ ...server, name, description }))
            .catch((error) => {
                console.error(error);
                addError({ key: 'settings', message: httpErrorToHuman(error) });
            })
            .then(() => toast.success(i18n.t('server:settings.updated_toast')));
    };

    return (
        <Formik
            onSubmit={submit}
            initialValues={{
                name: server.name,
                description: server.description,
            }}
            validationSchema={object().shape({
                name: string().required().min(1),
                description: string().nullable(),
            })}
        >
            <RenameServerForm />
        </Formik>
    );
};

export default RenameServerBox;
