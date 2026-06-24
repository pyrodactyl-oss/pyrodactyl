import { Pencil } from '@gravity-ui/icons';
import { useStoreState } from 'easy-peasy';
import { useNavigate } from 'react-router-dom';

import ActionButton from '@/components/elements/ActionButton';
import Can from '@/components/elements/Can';
import { PageListItem } from '@/components/elements/pages/PageList';
import RemoveSubuserButton from '@/components/server/users/RemoveSubuserButton';

import { ServerContext } from '@/state/server';
import type { Subuser } from '@/state/server/subusers';

interface Props {
    subuser: Subuser;
}

const UserRow = ({ subuser }: Props) => {
    const uuid = useStoreState((state) => state.user?.data?.uuid);
    const navigate = useNavigate();
    const serverId = ServerContext.useStoreState((state) => state.server.data?.id);

    const handleEditClick = () => {
        navigate(`/server/${serverId}/users/${subuser.uuid}/edit`);
    };

    return (
        <PageListItem>
            <div className={'hidden h-10 w-10 overflow-hidden rounded-full border-2 border-zinc-800 bg-white md:block'}>
                <img className={'h-full w-full'} src={`${subuser.image}?s=400`} />
            </div>
            <div className={'flex flex-1 flex-col overflow-hidden sm:ml-4'}>
                <p className={'truncate text-lg'}>{subuser.email}</p>
                <p className={'mt-1 truncate text-center text-xs text-zinc-400 sm:text-left md:mt-0'}>
                    {subuser.twoFactorEnabled ? 'MFA Enabled' : 'MFA Disabled'}
                </p>
            </div>

            <div className='flex flex-col items-center gap-4 sm:flex-row md:gap-12'>
                <div>
                    <p className={'text-center font-medium'}>
                        {subuser.permissions.filter((permission) => permission !== 'websocket.connect').length}
                    </p>
                    <p className={'text-xs text-zinc-500 uppercase'}>Permissions</p>
                </div>
                {subuser.uuid !== uuid && (
                    <div className='flex items-center justify-center gap-2 align-middle'>
                        <Can action={'user.update'}>
                            <ActionButton
                                aria-label='Edit subuser'
                                className='flex items-center gap-2'
                                onClick={handleEditClick}
                                size='sm'
                                variant='secondary'
                            >
                                <Pencil fill='currentColor' height={22} width={22} />
                                Edit
                            </ActionButton>
                        </Can>
                        <Can action={'user.delete'}>
                            <RemoveSubuserButton subuser={subuser} />
                        </Can>
                    </div>
                )}
            </div>
        </PageListItem>
    );
};

export default UserRow;
