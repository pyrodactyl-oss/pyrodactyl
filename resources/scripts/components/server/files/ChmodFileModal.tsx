import { Form, Formik, type FormikHelpers } from 'formik';
import chmodFiles from '@/api/server/files/chmodFiles';

import ActionButton from '@/components/elements/ActionButton';
import Field from '@/components/elements/Field';
import Modal, { type RequiredModalProps } from '@/components/elements/Modal';
import { fileBitsToString } from '@/helpers';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';

interface FormikValues {
    mode: string;
}

interface File {
    file: string;
    mode: string;
}

type OwnProps = RequiredModalProps & { files: File[] };

const ChmodFileModal = ({ files, ...props }: OwnProps) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const { mutate } = useFileManagerSwr();
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const setSelectedFiles = ServerContext.useStoreActions((actions) => actions.files.setSelectedFiles);

    const submit = async ({ mode }: FormikValues, { setSubmitting }: FormikHelpers<FormikValues>) => {
        clearFlashes('files');

        await mutate(
            (data) =>
                data?.map((f) =>
                    f.name === files[0]?.file ? { ...f, mode: fileBitsToString(mode, !f.isFile), modeBits: mode } : f,
                ),
            false,
        );

        const data = files.map((f) => ({ file: f.file, mode }));

        chmodFiles(uuid, directory, data)
            .then((): Promise<any> => (files.length > 0 ? mutate() : Promise.resolve()))
            .then(() => setSelectedFiles([]))
            .catch((error) => {
                mutate();
                setSubmitting(false);
                clearAndAddHttpError({ key: 'files', error });
            })
            .then(() => props.onDismissed());
    };

    return (
        <Formik initialValues={{ mode: files.length > 1 ? '' : (files[0]?.mode ?? '') }} onSubmit={submit}>
            {({ isSubmitting }) => (
                <Modal
                    {...props}
                    dismissable={!isSubmitting}
                    showSpinnerOverlay={isSubmitting}
                    title='Configure permissions'
                >
                    <Form className={'m-0 w-full'}>
                        <div className={'flex flex-col'}>
                            <div className={'w-full'}>
                                <Field
                                    autoFocus
                                    description={
                                        'This is intended for advanced users. You may irreperably damage your server by changing file permissions.'
                                    }
                                    id={'file_mode'}
                                    label={'File Mode'}
                                    name={'mode'}
                                    type={'string'}
                                />
                            </div>
                            <div className={'my-6 flex w-full justify-end'}>
                                <ActionButton type='submit' variant='primary'>
                                    Update
                                </ActionButton>
                            </div>
                        </div>
                    </Form>
                </Modal>
            )}
        </Formik>
    );
};

export default ChmodFileModal;
