import { Form, Formik, type FormikHelpers } from 'formik';
import { join } from 'pathe';
import { object, string } from 'yup';

import ActionButton from '@/components/elements/ActionButton';
import Field from '@/components/elements/Field';
import Modal, { type RequiredModalProps } from '@/components/elements/Modal';

import { ServerContext } from '@/state/server';

type Props = RequiredModalProps & {
    onFileNamed: (name: string) => void;
};

interface Values {
    fileName: string;
}

const FileNameModal = ({ onFileNamed, onDismissed, ...props }: Props) => {
    const directory = ServerContext.useStoreState((state) => state.files.directory);

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        onFileNamed(join(directory, values.fileName));
        setSubmitting(false);
    };

    return (
        <Formik
            initialValues={{ fileName: '' }}
            onSubmit={submit}
            validationSchema={object().shape({
                fileName: string().required().min(1),
            })}
        >
            {({ resetForm }) => (
                <Modal
                    onDismissed={() => {
                        resetForm();
                        onDismissed();
                    }}
                    title='New file'
                    {...props}
                >
                    <Form className='m-0 flex w-full flex-col gap-4'>
                        <Field
                            autoFocus
                            description={'Enter the name that this file should be saved as.'}
                            id={'fileName'}
                            label={'File Name'}
                            name={'fileName'}
                        />
                        <div className={'my-4 flex w-full justify-end'}>
                            <ActionButton variant='primary'>Create File</ActionButton>
                        </div>
                    </Form>
                </Modal>
            )}
        </Formik>
    );
};

export default FileNameModal;
