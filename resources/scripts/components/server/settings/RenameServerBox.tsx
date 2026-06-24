import { type Actions, useStoreActions } from 'easy-peasy';
import { Form, Formik } from 'formik';
import { toast } from 'sonner';
import { object, string } from 'yup';
import { httpErrorToHuman } from '@/api/http';
import renameServer from '@/api/server/renameServer';
import ActionButton from '@/components/elements/ActionButton';
import Field from '@/components/elements/Field';
import TitledGreyBox from '@/components/elements/TitledGreyBox';

import type { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';

interface Values {
    description: string;
    name: string;
}

const RenameServerForm = () => (
    <TitledGreyBox title={'Server Details'}>
        <Form className='flex flex-col gap-4'>
            <Field id={'name'} label={'Server Name'} name={'name'} type={'text'} />
            <Field id={'description'} label={'Server Description'} name={'description'} type={'text'} />
            <div className={'mt-6 text-right'}>
                <ActionButton type={'submit'} variant='primary'>
                    Save
                </ActionButton>
            </div>
        </Form>
    </TitledGreyBox>
);

const RenameServerBox = () => {
    const server = ServerContext.useStoreState((state) => state.server.data!);
    const setServer = ServerContext.useStoreActions((actions) => actions.server.setServer);
    const { addError, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const submit = ({ name, description }: Values) => {
        clearFlashes('settings');
        toast('Updating server details...');
        renameServer(server.uuid, name, description)
            .then(() => setServer({ ...server, name, description }))
            .catch((error) => {
                console.error(error);
                addError({ key: 'settings', message: httpErrorToHuman(error) });
            })
            .then(() => toast.success('Server details updated!'));
    };

    return (
        <Formik
            initialValues={{
                name: server.name,
                description: server.description,
            }}
            onSubmit={submit}
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
