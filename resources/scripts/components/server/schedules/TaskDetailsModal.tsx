import { Form, Formik, Field as FormikField, type FormikHelpers, useField } from 'formik';
import { useContext, useEffect } from 'react';
import styled from 'styled-components';
import { boolean, number, object, string } from 'yup';
import { httpErrorToHuman } from '@/api/http';
import createOrUpdateScheduleTask from '@/api/server/schedules/createOrUpdateScheduleTask';
import type { Schedule, Task } from '@/api/server/schedules/getServerSchedules';
import ActionButton from '@/components/elements/ActionButton';
import Field from '@/components/elements/Field';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import FormikSwitchV2 from '@/components/elements/FormikSwitchV2';
import { Textarea } from '@/components/elements/Input';
import Select from '@/components/elements/Select';
import FlashMessageRender from '@/components/FlashMessageRender';
import ModalContext from '@/context/ModalContext';
import asModal from '@/hoc/asModal';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';

// TODO: Port modern dropdowns to Formik and integrate them
// import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/components/elements/DropdownMenu';
// import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';

const Label = styled.label`
    display: inline-block;
    color: #ffffff77;
    font-size: 0.875rem;
    padding-bottom: 0.5rem;
`;

interface Props {
    schedule: Schedule;
    // If a task is provided we can assume we're editing it. If not provided,
    // we are creating a new one.
    task?: Task;
}

interface Values {
    action: string;
    continueOnFailure: boolean;
    payload: string;
    timeOffset: string;
}

const schema = object().shape({
    action: string().required().oneOf(['command', 'power', 'backup']),
    payload: string().when('action', {
        is: (v) => v !== 'backup',
        then: () => string().required('A task payload must be provided.'),
        otherwise: () => string(),
    }),
    continueOnFailure: boolean(),
    timeOffset: number()
        .typeError('The time offset must be a valid number between 0 and 900.')
        .required('A time offset value must be provided.')
        .min(0, 'The time offset must be at least 0 seconds.')
        .max(900, 'The time offset must be less than 900 seconds.'),
});

const ActionListener = () => {
    const [{ value }, { initialValue: initialAction }] = useField<string>('action');
    const [, { initialValue: initialPayload }, { setValue, setTouched }] = useField<string>('payload');

    useEffect(() => {
        if (value === initialAction) {
            setValue(initialPayload || '');
            setTouched(false);
        } else {
            setValue(value === 'power' ? 'start' : '');
            setTouched(false);
        }
    }, [value]);

    return null;
};

const TaskDetailsModal = ({ schedule, task }: Props) => {
    const { dismiss, setPropOverrides } = useContext(ModalContext);
    const { clearFlashes, addError } = useFlash();

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const appendSchedule = ServerContext.useStoreActions((actions) => actions.schedules.appendSchedule);
    const backupLimit = ServerContext.useStoreState((state) => state.server.data!.featureLimits.backups);

    useEffect(
        () => () => {
            clearFlashes('schedule:task');
        },
        [],
    );

    useEffect(() => {
        setPropOverrides({ title: task ? 'Edit Task' : 'Create Task' });
    }, []);

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('schedule:task');
        if (backupLimit === 0 && values.action === 'backup') {
            setSubmitting(false);
            addError({
                message: "A backup task cannot be created when the server's backup limit is set to 0.",
                key: 'schedule:task',
            });
        } else {
            createOrUpdateScheduleTask(uuid, schedule.id, task?.id, values)
                .then((task) => {
                    let tasks = schedule.tasks.map((t) => (t.id === task.id ? task : t));
                    if (!schedule.tasks.find((t) => t.id === task.id)) {
                        tasks = [...tasks, task];
                    }

                    appendSchedule({ ...schedule, tasks });
                    dismiss();
                })
                .catch((error) => {
                    console.error(error);
                    setSubmitting(false);
                    addError({ message: httpErrorToHuman(error), key: 'schedule:task' });
                });
        }
    };

    return (
        <div className='min-w-full'>
            <Formik
                initialValues={{
                    action: task?.action || 'command',
                    payload: task?.payload || '',
                    timeOffset: task?.timeOffset.toString() || '0',
                    continueOnFailure: task?.continueOnFailure,
                }}
                onSubmit={submit}
                validationSchema={schema}
            >
                {({ isSubmitting, values }) => (
                    <Form>
                        <FlashMessageRender byKey={'schedule:task'} />
                        <div className={'flex flex-col gap-3'}>
                            <div>
                                <Label>Action</Label>
                                <ActionListener />
                                <FormikFieldWrapper name={'action'}>
                                    <FormikField
                                        as={Select}
                                        className='min-w-full rounded-lg bg-[#ffffff11] px-4 py-2'
                                        name={'action'}
                                    >
                                        <option className='bg-black' value={'command'}>
                                            Send command
                                        </option>
                                        <option className='bg-black' value={'power'}>
                                            Power
                                        </option>
                                        <option className='bg-black' value={'backup'}>
                                            Create backup
                                        </option>
                                    </FormikField>
                                </FormikFieldWrapper>
                            </div>
                            <div>
                                <Field
                                    description={
                                        'The amount of time to wait after the previous task executes before running this one. If this is the first task on a schedule this will not be applied.'
                                    }
                                    label={'Time offset (in seconds)'}
                                    name={'timeOffset'}
                                />
                            </div>
                        </div>
                        <div className={'my-6'}>
                            {values.action === 'command' ? (
                                <div>
                                    <Label>Payload</Label>
                                    <FormikFieldWrapper name={'payload'}>
                                        <FormikField
                                            as={Textarea}
                                            className='w-full rounded-xl bg-[#ffffff11] p-2'
                                            name={'payload'}
                                            rows={6}
                                        />
                                    </FormikFieldWrapper>
                                </div>
                            ) : values.action === 'power' ? (
                                <div>
                                    <Label>Payload</Label>
                                    <FormikFieldWrapper name={'payload'}>
                                        <FormikField
                                            as={Select}
                                            className='min-w-full rounded-lg bg-[#ffffff11] px-4 py-2'
                                            name={'payload'}
                                        >
                                            <option className='bg-black' value={'start'}>
                                                Start the server
                                            </option>
                                            <option className='bg-black' value={'restart'}>
                                                Restart the server
                                            </option>
                                            <option className='bg-black' value={'stop'}>
                                                Stop the server
                                            </option>
                                            <option className='bg-black' value={'kill'}>
                                                Terminate the server
                                            </option>
                                        </FormikField>
                                    </FormikFieldWrapper>
                                </div>
                            ) : (
                                <div>
                                    <Label>Ignored files (optional)</Label>
                                    <FormikFieldWrapper
                                        description={
                                            'Include the files and folders to be excluded in this backup. By default, the contents of your .pyroignore file will be used. If you have reached your backup limit, the oldest backup will be rotated.'
                                        }
                                        name={'payload'}
                                    >
                                        <FormikField
                                            as={Textarea}
                                            className='w-full rounded-2xl bg-[#ffffff11]'
                                            name={'payload'}
                                            rows={6}
                                        />
                                    </FormikFieldWrapper>
                                </div>
                            )}
                        </div>
                        <FormikSwitchV2
                            description={'Future tasks will be run if this task fails.'}
                            label={'Continue on Failure'}
                            name={'continueOnFailure'}
                        />
                        <div className={'my-6 flex justify-end'}>
                            <ActionButton disabled={isSubmitting} type={'submit'} variant='primary'>
                                {task ? 'Save Changes' : 'Create Task'}
                            </ActionButton>
                        </div>
                    </Form>
                )}
            </Formik>
        </div>
    );
};

export default asModal<Props>()(TaskDetailsModal);
