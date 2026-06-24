import { ChevronLeft } from '@gravity-ui/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ActionButton from '@/components/elements/ActionButton';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import UserFormComponent from '@/components/server/users/UserFormComponent';

import { ServerContext } from '@/state/server';

const CreateUserContainer = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const serverId = ServerContext.useStoreState((state) => state.server.data?.id);

    const handleSuccess = () => {
        navigate(`/server/${serverId}/users`);
    };

    const handleCancel = () => {
        navigate(`/server/${serverId}/users`);
    };

    return (
        <ServerContentBlock title={'Create User'}>
            <MainPageHeader title={'Create New User'}>
                <ActionButton
                    className='flex items-center gap-2'
                    disabled={isSubmitting}
                    onClick={() => navigate(`/server/${serverId}/users`)}
                    variant='secondary'
                >
                    <ChevronLeft fill='currentColor' height={22} width={22} />
                    Back to Users
                </ActionButton>
            </MainPageHeader>

            <UserFormComponent
                flashKey='user:create'
                isSubmitting={isSubmitting}
                onCancel={handleCancel}
                onSuccess={handleSuccess}
                setIsSubmitting={setIsSubmitting}
            />
        </ServerContentBlock>
    );
};

export default CreateUserContainer;
