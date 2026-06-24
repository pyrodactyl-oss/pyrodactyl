import { AntennaSignal, Calendar, Copy, Database, FolderOpen, Gear, Person, Server, Shield } from '@gravity-ui/icons';
import { type Actions, useStoreActions, useStoreState } from 'easy-peasy';
import { Form, Formik } from 'formik';
import { useEffect } from 'react';
import { array, object, string } from 'yup';
import createOrUpdateSubuser from '@/api/server/users/createOrUpdateSubuser';
import ActionButton from '@/components/elements/ActionButton';
import Can from '@/components/elements/Can';
import Field from '@/components/elements/Field';
import FlashMessageRender from '@/components/FlashMessageRender';
import PermissionRow from '@/components/server/users/PermissionRow';
import { useDeepCompareMemo } from '@/plugins/useDeepCompareMemo';
import { usePermissions } from '@/plugins/usePermissions';
import type { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';
import type { Subuser } from '@/state/server/subusers';

interface Values {
    email: string;
    permissions: string[];
}

interface Props {
    flashKey: string;
    isSubmitting?: boolean;
    onCancel: () => void;
    onSuccess: (subuser: Subuser) => void;
    setIsSubmitting?: (submitting: boolean) => void;
    subuser?: Subuser;
}

const UserFormComponent = ({ subuser, onSuccess, onCancel, flashKey, isSubmitting, setIsSubmitting }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const appendSubuser = ServerContext.useStoreActions((actions) => actions.subusers.appendSubuser);
    const { clearFlashes, clearAndAddHttpError } = useStoreActions(
        (actions: Actions<ApplicationStore>) => actions.flashes,
    );

    const isRootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const permissions = useStoreState((state) => state.permissions.data);
    const loggedInPermissions = ServerContext.useStoreState((state) => state.server.permissions);
    const [canEditUser] = usePermissions(subuser ? ['user.update'] : ['user.create']);

    // The permissions that can be modified by this user.
    const editablePermissions = useDeepCompareMemo(() => {
        const cleaned = Object.keys(permissions).map((key) =>
            Object.keys(permissions[key]?.keys ?? {}).map((pkey) => `${key}.${pkey}`),
        );

        const list: string[] = ([] as string[]).concat.apply([], Object.values(cleaned));

        if (isRootAdmin || (loggedInPermissions.length === 1 && loggedInPermissions[0] === '*')) {
            return list;
        }

        return list.filter((key) => loggedInPermissions.indexOf(key) >= 0);
    }, [isRootAdmin, permissions, loggedInPermissions]);

    const submit = (values: Values) => {
        if (setIsSubmitting) setIsSubmitting(true);
        clearFlashes(flashKey);

        createOrUpdateSubuser(uuid, values, subuser)
            .then((subuser) => {
                appendSubuser(subuser);
                onSuccess(subuser);
            })
            .catch((error) => {
                console.error(error);
                if (setIsSubmitting) setIsSubmitting(false);
                clearAndAddHttpError({ key: flashKey, error });
            });
    };

    useEffect(
        () => () => {
            clearFlashes(flashKey);
        },
        [],
    );

    const getPermissionIcon = (key: string) => {
        switch (key) {
            case 'control':
                return Server;
            case 'user':
                return Person;
            case 'file':
                return FolderOpen;
            case 'backup':
                return Copy;
            case 'allocation':
                return AntennaSignal;
            case 'startup':
                return Gear;
            case 'database':
                return Database;
            case 'schedule':
                return Calendar;
            default:
                return Shield;
        }
    };

    return (
        <>
            <FlashMessageRender byKey={flashKey} />

            <Formik
                initialValues={
                    {
                        email: subuser?.email || '',
                        permissions: subuser?.permissions || [],
                    } as Values
                }
                onSubmit={submit}
                validationSchema={object().shape({
                    email: string()
                        .max(191, 'Email addresses must not exceed 191 characters.')
                        .email('A valid email address must be provided.')
                        .required('A valid email address must be provided.'),
                    permissions: array().of(string()),
                })}
            >
                {({ setFieldValue, values }) => (
                    <Form className='space-y-6'>
                        {/* User Information Section */}
                        {!subuser && (
                            <div className='rounded-xl border border-[#ffffff12] bg-gradient-to-b from-[#ffffff08] to-[#ffffff05] p-6'>
                                <div className='mb-6 flex items-center gap-3'>
                                    <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-brand/20'>
                                        <Person
                                            className='h-5 w-5 text-brand'
                                            fill='currentColor'
                                            height={22}
                                            width={22}
                                        />
                                    </div>
                                    <h3 className='font-semibold text-xl text-zinc-100'>User Information</h3>
                                </div>
                                <Field
                                    description={
                                        'Enter the email address of the user you wish to invite as a subuser for this server.'
                                    }
                                    label={'Email Address'}
                                    name={'email'}
                                />
                            </div>
                        )}

                        {/* Permissions Section */}
                        <div className='rounded-xl border border-[#ffffff12] bg-gradient-to-b from-[#ffffff08] to-[#ffffff05] p-6'>
                            <div className='mb-6 flex items-center justify-between'>
                                <div className='flex items-center gap-3'>
                                    <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-brand/20'>
                                        <Gear
                                            className='h-5 w-5 text-brand'
                                            fill='currentColor'
                                            height={22}
                                            width={22}
                                        />
                                    </div>
                                    <h3 className='font-semibold text-xl text-zinc-100'>Detailed Permissions</h3>
                                </div>
                                {canEditUser && (
                                    <button
                                        className='rounded-lg border border-brand/20 bg-brand/10 px-4 py-2 font-medium text-brand text-sm transition-colors hover:border-brand/30 hover:bg-brand/20'
                                        onClick={() => {
                                            const allPermissions = editablePermissions;
                                            const allSelected = allPermissions.every((p) =>
                                                values.permissions.includes(p),
                                            );
                                            if (allSelected) {
                                                setFieldValue('permissions', []);
                                            } else {
                                                setFieldValue('permissions', [...allPermissions]);
                                            }
                                        }}
                                        type='button'
                                    >
                                        {editablePermissions.every((p) => values.permissions.includes(p))
                                            ? 'Deselect All'
                                            : 'Select All'}
                                    </button>
                                )}
                            </div>

                            {!isRootAdmin && loggedInPermissions[0] !== '*' && (
                                <div className='mb-6 rounded-lg border border-brand/20 bg-brand/10 p-4'>
                                    <div className='mb-2 flex items-center gap-3'>
                                        <Shield
                                            className='h-5 w-5 text-brand'
                                            fill='currentColor'
                                            height={22}
                                            width={22}
                                        />
                                        <span className='font-semibold text-brand text-sm'>Permission Restriction</span>
                                    </div>
                                    <p className='text-sm text-zinc-300 leading-relaxed'>
                                        You can only assign permissions that you currently have access to.
                                    </p>
                                </div>
                            )}

                            <div className='space-y-4'>
                                {Object.keys(permissions)
                                    .filter((key) => key !== 'websocket')
                                    .map((key) => (
                                        <div className='rounded-lg border border-[#ffffff12] p-4' key={key}>
                                            <div className='mb-3 flex items-start justify-between'>
                                                <div className='flex min-w-0 flex-1 items-start gap-3'>
                                                    {(() => {
                                                        const Icon = getPermissionIcon(key);
                                                        return (
                                                            <Icon
                                                                className='mt-0.5 flex-shrink-0 text-brand'
                                                                fill='currentColor'
                                                                height={22}
                                                                width={22}
                                                            />
                                                        );
                                                    })()}
                                                    <div className='min-w-0 flex-1'>
                                                        <h4 className='font-medium text-zinc-200 capitalize'>{key}</h4>
                                                        <p className='mt-1 break-words text-xs text-zinc-400'>
                                                            {permissions[key]?.description}
                                                        </p>
                                                    </div>
                                                </div>
                                                {canEditUser && (
                                                    <button
                                                        className='flex-shrink-0 whitespace-nowrap rounded bg-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-600'
                                                        onClick={() => {
                                                            const categoryPermissions = Object.keys(
                                                                permissions[key]?.keys ?? {},
                                                            ).map((pkey) => `${key}.${pkey}`);
                                                            const allSelected = categoryPermissions.every((p) =>
                                                                values.permissions.includes(p),
                                                            );
                                                            if (allSelected) {
                                                                setFieldValue(
                                                                    'permissions',
                                                                    values.permissions.filter(
                                                                        (p) => !categoryPermissions.includes(p),
                                                                    ),
                                                                );
                                                            } else {
                                                                const newPermissions = [...values.permissions];
                                                                categoryPermissions.forEach((p) => {
                                                                    if (
                                                                        !newPermissions.includes(p) &&
                                                                        editablePermissions.includes(p)
                                                                    ) {
                                                                        newPermissions.push(p);
                                                                    }
                                                                });
                                                                setFieldValue('permissions', newPermissions);
                                                            }
                                                        }}
                                                        type='button'
                                                    >
                                                        {Object.keys(permissions[key]?.keys ?? {})
                                                            .map((pkey) => `${key}.${pkey}`)
                                                            .every((p) => values.permissions.includes(p))
                                                            ? 'Deselect All'
                                                            : 'Select All'}
                                                    </button>
                                                )}
                                            </div>

                                            <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
                                                {Object.keys(permissions[key]?.keys ?? {}).map((pkey) => (
                                                    <PermissionRow
                                                        disabled={
                                                            !canEditUser ||
                                                            editablePermissions.indexOf(`${key}.${pkey}`) < 0
                                                        }
                                                        key={`permission_${key}.${pkey}`}
                                                        permission={`${key}.${pkey}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <Can action={subuser ? 'user.update' : 'user.create'}>
                            <div className='flex justify-end gap-3 border-[#ffffff12] border-t pt-4'>
                                <ActionButton onClick={onCancel} type='button' variant='secondary'>
                                    Cancel
                                </ActionButton>
                                <ActionButton disabled={isSubmitting} type='submit' variant='primary'>
                                    {subuser ? 'Save Changes' : 'Invite User'}
                                </ActionButton>
                            </div>
                        </Can>
                    </Form>
                )}
            </Formik>
        </>
    );
};

export default UserFormComponent;
