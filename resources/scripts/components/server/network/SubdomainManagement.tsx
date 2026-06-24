import { Link } from '@gravity-ui/icons';
import { Field, Form, Formik, type FormikHelpers } from 'formik';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as yup from 'yup';
import {
    checkSubdomainAvailability,
    deleteSubdomain,
    getSubdomainInfo,
    type SubdomainInfo,
    setSubdomain,
} from '@/api/server/network/subdomain';
import ActionButton from '@/components/elements/ActionButton';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import FlashMessageRender from '@/components/FlashMessageRender';
import { useFlashKey } from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';

interface AvailableDomain {
    id: number;
    is_active: boolean;
    is_default: boolean;
    name: string;
}

interface SubdomainFormValues {
    domain_id: string;
    subdomain: string;
}

const CleanInput = ({
    className = '',
    ref,
    ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { ref?: React.RefObject<HTMLInputElement | null> }) => (
    <input
        className={`border-0 bg-transparent text-white placeholder-zinc-400 outline-none focus:ring-0 ${className}`}
        ref={ref}
        {...props}
    />
);
CleanInput.displayName = 'CleanInput';

const CleanSelect = ({
    className = '',
    children,
    ref,
    ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { ref?: React.RefObject<HTMLSelectElement | null> }) => (
    <select
        className={`border-0 bg-transparent text-zinc-300 outline-none focus:ring-0 ${className}`}
        ref={ref}
        {...props}
    >
        {children}
    </select>
);
CleanSelect.displayName = 'CleanSelect';

const validationSchema = yup.object().shape({
    subdomain: yup
        .string()
        .required('A subdomain name is required.')
        .min(1, 'Subdomain must be at least 1 character.')
        .max(63, 'Subdomain cannot exceed 63 characters.')
        .matches(
            /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i,
            'Subdomain can only contain lowercase letters, numbers, and hyphens. It must start and end with a letter or number.',
        ),
    domain_id: yup.string().required('A domain must be selected.'),
});

const SubdomainManagement = () => {
    const [loading, setLoading] = useState(false);
    const [subdomainInfo, setSubdomainInfo] = useState<SubdomainInfo | null>(null);
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [availabilityStatus, setAvailabilityStatus] = useState<{
        checked: boolean;
        available: boolean;
        message: string;
    } | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const { clearFlashes, clearAndAddHttpError } = useFlashKey('server:network:subdomain');

    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        loadSubdomainInfo();
    }, [loadSubdomainInfo]);

    const loadSubdomainInfo = async () => {
        try {
            clearFlashes();
            const data = await getSubdomainInfo(uuid);
            setSubdomainInfo(data);
        } catch (error) {
            clearAndAddHttpError(error as Error);
        }
    };

    const checkAvailability = useCallback(
        async (subdomain: string, domainId: string) => {
            if (!(subdomain?.trim() && domainId)) {
                setAvailabilityStatus(null);
                return;
            }

            // Don't check availability for current subdomain unless domain changed
            if (
                subdomainInfo?.current_subdomain &&
                subdomainInfo.current_subdomain.attributes.subdomain === subdomain.trim() &&
                subdomainInfo.current_subdomain.attributes.domain_id.toString() === domainId
            ) {
                setAvailabilityStatus(null);
                return;
            }

            try {
                setCheckingAvailability(true);
                const response = await checkSubdomainAvailability(
                    uuid,
                    subdomain.trim(),
                    Number.parseInt(domainId, 10),
                );
                setAvailabilityStatus({
                    checked: true,
                    available: response.available,
                    message: response.message,
                });
            } catch {
                setAvailabilityStatus({
                    checked: true,
                    available: false,
                    message: 'Failed to check availability. Please try again.',
                });
            } finally {
                setCheckingAvailability(false);
            }
        },
        [uuid, subdomainInfo?.current_subdomain],
    );

    const debouncedCheckAvailability = useCallback(
        (subdomain: string, domainId: string) => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }

            debounceTimeoutRef.current = setTimeout(() => {
                checkAvailability(subdomain, domainId);
            }, 500);
        },
        [checkAvailability],
    );

    useEffect(
        () => () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        },
        [],
    );

    const handleSetSubdomain = async (
        values: SubdomainFormValues,
        { setSubmitting, resetForm }: FormikHelpers<SubdomainFormValues>,
    ) => {
        try {
            clearFlashes();
            setLoading(true);
            await setSubdomain(uuid, values.subdomain.trim(), Number.parseInt(values.domain_id, 10));
            await loadSubdomainInfo();
            setAvailabilityStatus(null);
            if (isEditing) {
                setIsEditing(false);
            } else {
                resetForm();
            }
        } catch (error) {
            clearAndAddHttpError(error as Error);
        } finally {
            setLoading(false);
            setSubmitting(false);
        }
    };

    const handleDeleteSubdomain = async () => {
        if (
            !confirm(
                'Are you sure you want to delete this subdomain? This will remove all associated DNS records and cannot be undone.',
            )
        ) {
            return;
        }

        try {
            clearFlashes();
            setLoading(true);
            await deleteSubdomain(uuid);
            await loadSubdomainInfo();
            setAvailabilityStatus(null);
        } catch (error) {
            clearAndAddHttpError(error as Error);
        } finally {
            setLoading(false);
        }
    };

    if (!subdomainInfo) {
        return (
            <div className='rounded-xl border-[#ffffff12] border-[1px] bg-gradient-to-b from-[#ffffff08] to-[#ffffff05] p-6 shadow-sm'>
                <div className='flex items-center justify-center py-12'>
                    <div className='flex flex-col items-center gap-3'>
                        <div className='h-6 w-6 animate-spin rounded-full border-brand border-b-2' />
                        <p className='text-neutral-400 text-sm'>Loading subdomain configuration...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!subdomainInfo?.supported) {
        return null; // Don't show anything if subdomains aren't supported
    }

    if (!subdomainInfo?.available_domains || subdomainInfo.available_domains.length === 0) {
        return (
            <div className='rounded-xl border-[#ffffff12] border-[1px] bg-gradient-to-b from-[#ffffff08] to-[#ffffff05] p-6 shadow-sm'>
                <div className='mb-6 flex items-center justify-between'>
                    <h3 className='font-extrabold text-xl tracking-tight'>Subdomain Management</h3>
                </div>
                <div className='flex flex-col items-center justify-center py-12'>
                    <div className='text-center'>
                        <div className='mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#ffffff11]'>
                            <svg className='h-6 w-6 text-zinc-400' fill='currentColor' viewBox='0 0 20 20'>
                                <path
                                    clipRule='evenodd'
                                    d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                                    fillRule='evenodd'
                                />
                            </svg>
                        </div>
                        <h4 className='mb-1 font-medium text-md text-zinc-200'>No domains configured</h4>
                        <p className='max-w-sm text-sm text-zinc-400'>
                            Contact your administrator to configure subdomain support for this server.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='rounded-xl border-[#ffffff12] border-[1px] bg-gradient-to-b from-[#ffffff08] to-[#ffffff05] p-6 shadow-sm'>
            <div className='mb-6 flex items-center gap-3'>
                <Link className='h-6 w-6 text-zinc-400' fill='currentColor' />
                <h3 className='font-extrabold text-xl tracking-tight'>Subdomain Management</h3>
                {subdomainInfo?.current_subdomain && (
                    <div className='ml-auto flex items-center gap-2 text-sm'>
                        <div
                            className={`h-2 w-2 rounded-full ${subdomainInfo.current_subdomain.attributes.is_active ? 'bg-green-400' : 'bg-red-400'}`}
                        />
                        <span
                            className={
                                subdomainInfo.current_subdomain.attributes.is_active ? 'text-green-400' : 'text-red-400'
                            }
                        >
                            {subdomainInfo.current_subdomain.attributes.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                )}
            </div>

            <FlashMessageRender byKey={'server:network:subdomain'} />

            {subdomainInfo?.current_subdomain && !isEditing ? (
                /* Current Subdomain Display Mode */
                <div className='space-y-4'>
                    <div className='rounded-lg border border-[#ffffff15] bg-[#ffffff08] p-4'>
                        <div className='flex items-center justify-between'>
                            <div>
                                <p className='mb-2 text-sm text-zinc-400'>Current Subdomain</p>
                                <p className='font-medium font-mono text-lg text-white'>
                                    {subdomainInfo?.current_subdomain?.attributes?.full_domain}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className='flex items-center justify-end gap-3 border-[#ffffff15] border-t pt-4'>
                        <ActionButton
                            disabled={loading}
                            onClick={handleDeleteSubdomain}
                            size='sm'
                            type='button'
                            variant='danger'
                        >
                            {loading ? 'Deleting...' : 'Delete Subdomain'}
                        </ActionButton>
                        <ActionButton
                            disabled={loading}
                            onClick={() => setIsEditing(true)}
                            size='sm'
                            type='button'
                            variant='primary'
                        >
                            Edit Subdomain
                        </ActionButton>
                    </div>
                </div>
            ) : (
                /* Form Mode (Create or Edit) */
                <Formik
                    enableReinitialize
                    initialValues={{
                        subdomain: subdomainInfo?.current_subdomain?.attributes?.subdomain || '',
                        domain_id:
                            subdomainInfo?.current_subdomain?.attributes?.domain_id?.toString() ||
                            (subdomainInfo?.available_domains as AvailableDomain[])
                                ?.find((d) => d.is_default)
                                ?.id.toString() ||
                            subdomainInfo?.available_domains?.[0]?.id.toString() ||
                            '',
                    }}
                    onSubmit={handleSetSubdomain}
                    validationSchema={validationSchema}
                >
                    {({ values, setFieldValue, isSubmitting, isValid, errors, resetForm }) => (
                        <Form className='space-y-6'>
                            <div className='space-y-4'>
                                <FormikFieldWrapper
                                    description='Choose a unique name for your subdomain. Only lowercase letters, numbers, and hyphens are allowed.'
                                    label='Subdomain'
                                    name='subdomain'
                                >
                                    <div className='flex items-center overflow-hidden border border-[#ffffff15] transition-colors hover:border-[#ffffff25]'>
                                        <Field
                                            as={CleanInput}
                                            className='flex-1 px-4 py-3'
                                            name='subdomain'
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                                                setFieldValue('subdomain', value);
                                                if (values.domain_id && value.trim()) {
                                                    debouncedCheckAvailability(value, values.domain_id);
                                                } else {
                                                    setAvailabilityStatus(null);
                                                    if (debounceTimeoutRef.current) {
                                                        clearTimeout(debounceTimeoutRef.current);
                                                    }
                                                }
                                            }}
                                            placeholder='myserver'
                                        />
                                        <div className='border-[#ffffff15] border-l'>
                                            <Field
                                                as={CleanSelect}
                                                className='min-w-[140px] px-4 py-3'
                                                name='domain_id'
                                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                                    const value = e.target.value;
                                                    setFieldValue('domain_id', value);
                                                    if (values.subdomain?.trim()) {
                                                        debouncedCheckAvailability(values.subdomain, value);
                                                    }
                                                }}
                                            >
                                                {(subdomainInfo?.available_domains as AvailableDomain[])?.map(
                                                    (domain) => (
                                                        <option key={domain.id} value={domain.id}>
                                                            .{domain.name}
                                                        </option>
                                                    ),
                                                ) || []}
                                            </Field>
                                        </div>
                                    </div>
                                </FormikFieldWrapper>

                                {/* Availability Status */}
                                {(checkingAvailability || availabilityStatus) && (
                                    <div
                                        className={`rounded-lg border p-4 ${checkingAvailability ? 'border-blue-500/20 bg-blue-500/10' : availabilityStatus?.available ? 'border-green-500/20 bg-green-500/10' : 'border-red-500/20 bg-red-500/10'}`}
                                    >
                                        {checkingAvailability ? (
                                            <div className='flex items-center text-blue-300 text-sm'>
                                                <div className='mr-3 h-4 w-4 animate-spin rounded-full border-blue-400 border-b-2' />
                                                Checking availability...
                                            </div>
                                        ) : (
                                            availabilityStatus && (
                                                <div
                                                    className={`flex items-center font-medium text-sm ${availabilityStatus.available ? 'text-green-300' : 'text-red-300'}`}
                                                >
                                                    <div
                                                        className={`mr-3 h-3 w-3 rounded-full ${availabilityStatus.available ? 'bg-green-400' : 'bg-red-400'}`}
                                                    />
                                                    {availabilityStatus.message}
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className='flex items-center justify-end gap-3 border-[#ffffff15] border-t pt-6'>
                                {isEditing ? (
                                    <>
                                        <ActionButton
                                            disabled={isSubmitting || loading}
                                            onClick={() => {
                                                setIsEditing(false);
                                                resetForm();
                                                setAvailabilityStatus(null);
                                            }}
                                            size='sm'
                                            type='button'
                                            variant='secondary'
                                        >
                                            Cancel
                                        </ActionButton>
                                        <ActionButton
                                            disabled={
                                                isSubmitting ||
                                                loading ||
                                                !isValid ||
                                                !values.subdomain.trim() ||
                                                !values.domain_id ||
                                                (availabilityStatus?.checked && !availabilityStatus?.available)
                                            }
                                            size='sm'
                                            type='submit'
                                            variant='primary'
                                        >
                                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                                        </ActionButton>
                                    </>
                                ) : (
                                    <ActionButton
                                        disabled={
                                            isSubmitting ||
                                            loading ||
                                            !isValid ||
                                            !values.subdomain.trim() ||
                                            !values.domain_id ||
                                            (availabilityStatus?.checked && !availabilityStatus?.available)
                                        }
                                        size='sm'
                                        type='submit'
                                        variant='primary'
                                    >
                                        {isSubmitting ? 'Creating...' : 'Create Subdomain'}
                                    </ActionButton>
                                )}
                            </div>
                        </Form>
                    )}
                </Formik>
            )}
        </div>
    );
};

export default SubdomainManagement;
