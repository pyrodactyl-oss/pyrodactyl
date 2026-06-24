import { ChevronLeft, Person } from '@gravity-ui/icons';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import ActionButton from '@/components/elements/ActionButton';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import UserFormComponent from '@/components/server/users/UserFormComponent';

import { ServerContext } from '@/state/server';
import type { Subuser } from '@/state/server/subusers';

const EditUserContainer = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const serverId = ServerContext.useStoreState((state) => state.server.data!.id);
    const subusers = ServerContext.useStoreState((state) => state.subusers.data);

    // Find the subuser by UUID
    const subuser = subusers.find((s: Subuser) => s.uuid === id);

    useEffect(() => {
        // If subuser not found, redirect back to users list
        if (!subuser && subusers.length > 0) {
            navigate(`/server/${serverId}/users`);
        }
    }, [subuser, subusers, navigate, serverId]);

    const handleSuccess = () => {
        navigate(`/server/${serverId}/users`);
    };

    const handleCancel = () => {
        navigate(`/server/${serverId}/users`);
    };

    // Show loading state while we're waiting for subusers to load
    if (!subuser && subusers.length === 0) {
        return (
            <ServerContentBlock title={'Edit User'}>
                <MainPageHeader title={'Edit User'}>
                    <ActionButton
                        className='flex items-center gap-2'
                        onClick={() => navigate(`/server/${serverId}/users`)}
                        variant='secondary'
                    >
                        <ChevronLeft fill='currentColor' height={22} width={22} />
                        Back to Users
                    </ActionButton>
                </MainPageHeader>
                <div className='flex items-center justify-center py-12'>
                    <div className='h-8 w-8 animate-spin rounded-full border-brand border-b-2' />
                </div>
            </ServerContentBlock>
        );
    }

    // If subuser not found after loading, show not found message
    if (!subuser) {
        return (
            <ServerContentBlock title={'Edit User'}>
                <MainPageHeader title={'Edit User'}>
                    <ActionButton
                        className='flex items-center gap-2'
                        onClick={() => navigate(`/server/${serverId}/users`)}
                        variant='secondary'
                    >
                        <ChevronLeft className='h-4 w-4' fill='currentColor' height={22} width={22} />
                        Back to Users
                    </ActionButton>
                </MainPageHeader>
                <div className='flex flex-col items-center justify-center px-4 py-12'>
                    <div className='text-center'>
                        <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#ffffff11]'>
                            <Person className='h-8 w-8 text-zinc-400' fill='currentColor' height={22} width={22} />
                        </div>
                        <h3 className='mb-2 font-medium text-lg text-zinc-200'>User not found</h3>
                        <p className='max-w-sm text-sm text-zinc-400'>
                            The user you&apos;re trying to edit could not be found.
                        </p>
                    </div>
                </div>
            </ServerContentBlock>
        );
    }

    return (
        <ServerContentBlock title={'Edit User'}>
            <MainPageHeader title={`Edit User: ${subuser.email}`}>
                <ActionButton
                    className='flex items-center gap-2'
                    disabled={isSubmitting}
                    onClick={() => navigate(`/server/${serverId}/users`)}
                    variant='secondary'
                >
                    <ChevronLeft className='h-4 w-4' fill='currentColor' height={22} width={22} />
                    Back to Users
                </ActionButton>
            </MainPageHeader>

            <UserFormComponent
                flashKey='user:edit'
                isSubmitting={isSubmitting}
                onCancel={handleCancel}
                onSuccess={handleSuccess}
                setIsSubmitting={setIsSubmitting}
                subuser={subuser}
            />
        </ServerContentBlock>
    );
};

export default EditUserContainer;
