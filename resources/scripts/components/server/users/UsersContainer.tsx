import { Person, Plus } from '@gravity-ui/icons';
import { type Actions, useStoreActions, useStoreState } from 'easy-peasy';
import { For } from 'million/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { httpErrorToHuman } from '@/api/http';
import getServerSubusers from '@/api/server/users/getServerSubusers';
import ActionButton from '@/components/elements/ActionButton';
import Can from '@/components/elements/Can';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import { PageListContainer } from '@/components/elements/pages/PageList';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import FlashMessageRender from '@/components/FlashMessageRender';
import UserRow from '@/components/server/users/UserRow';

import type { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';

const UsersContainer = () => {
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const serverId = ServerContext.useStoreState((state) => state.server.data?.id);
    const subusers = ServerContext.useStoreState((state) => state.subusers.data);
    const setSubusers = ServerContext.useStoreActions((actions) => actions.subusers.setSubusers);

    const permissions = useStoreState((state: ApplicationStore) => state.permissions.data);
    const getPermissions = useStoreActions((actions: Actions<ApplicationStore>) => actions.permissions.getPermissions);
    const { addError, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    useEffect(() => {
        clearFlashes('users');
        getServerSubusers(uuid)
            .then((subusers) => {
                setSubusers(subusers);
                setLoading(false);
            })
            .catch((error) => {
                console.error(error);
                addError({ key: 'users', message: httpErrorToHuman(error) });
            });
    }, [uuid, addError, setSubusers, clearFlashes]);

    useEffect(() => {
        getPermissions().catch((error) => {
            addError({ key: 'users', message: httpErrorToHuman(error) });
            console.error(error);
        });
    }, [getPermissions, addError]);

    if (!subusers.length && (loading || !Object.keys(permissions).length)) {
        return (
            <ServerContentBlock title={'Users'}>
                <FlashMessageRender byKey={'users'} />
                <MainPageHeader
                    direction='column'
                    title={'Users'}
                    titleChildren={
                        <div className='flex flex-col items-center justify-end gap-4 sm:flex-row'>
                            <p className='text-center text-sm text-zinc-300 sm:text-right'>0 users</p>
                            <Can action={'user.create'}>
                                <ActionButton
                                    className='flex items-center gap-2'
                                    onClick={() => navigate(`/server/${serverId}/users/new`)}
                                    variant='primary'
                                >
                                    <Plus className='h-4 w-4' fill='currentColor' height={22} width={22} />
                                    New User
                                </ActionButton>
                            </Can>
                        </div>
                    }
                >
                    <p className='text-neutral-400 text-sm leading-relaxed'>
                        Manage user access to your server. Grant specific permissions to other users to help you manage
                        and maintain your server.
                    </p>
                </MainPageHeader>
                <div className='flex items-center justify-center py-12'>
                    <div className='h-8 w-8 animate-spin rounded-full border-brand border-b-2' />
                </div>
            </ServerContentBlock>
        );
    }

    return (
        <ServerContentBlock title={'Users'}>
            <FlashMessageRender byKey={'users'} />
            <MainPageHeader
                direction='column'
                title={'Users'}
                titleChildren={
                    <div className='flex flex-col items-center justify-end gap-4 sm:flex-row'>
                        <p className='text-center text-sm text-zinc-300 sm:text-right'>{subusers.length} users</p>
                        <Can action={'user.create'}>
                            <ActionButton
                                className='flex items-center gap-2'
                                onClick={() => navigate(`/server/${serverId}/users/new`)}
                                variant='primary'
                            >
                                <Plus className='h-4 w-4' fill='currentColor' height={22} width={22} />
                                New User
                            </ActionButton>
                        </Can>
                    </div>
                }
            >
                <p className='text-neutral-400 text-sm leading-relaxed'>
                    Manage user access to your server. Grant specific permissions to other users to help you manage and
                    maintain your server.
                </p>
            </MainPageHeader>
            {subusers.length ? (
                <PageListContainer data-pyro-users-container-users>
                    <For each={subusers} memo>
                        {(subuser) => <UserRow key={subuser.uuid} subuser={subuser} />}
                    </For>
                </PageListContainer>
            ) : (
                <div className='flex min-h-[60vh] flex-col items-center justify-center px-4 py-12'>
                    <div className='text-center'>
                        <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#ffffff11]'>
                            <Person className='h-8 w-8 text-zinc-400' fill='currentColor' height={22} width={22} />
                        </div>
                        <h3 className='mb-2 font-medium text-lg text-zinc-200'>No users found</h3>
                        <p className='max-w-sm text-sm text-zinc-400'>
                            Your server does not have any additional users. Add others to help you manage your server.
                        </p>
                    </div>
                </div>
            )}
        </ServerContentBlock>
    );
};

export default UsersContainer;
