import { ChevronLeft } from '@gravity-ui/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import i18n from '@/lib/i18n';

import ActionButton from '@/components/elements/ActionButton';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import UserFormComponent from '@/components/server/users/UserFormComponent';

import { ServerContext } from '@/state/server';

const CreateUserContainer = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const serverId = ServerContext.useStoreState((state) => state.server.data!.id);

    const handleSuccess = () => {
        navigate(`/server/${serverId}/users`);
    };

    const handleCancel = () => {
        navigate(`/server/${serverId}/users`);
    };

    return (
        <ServerContentBlock title={i18n.t('server:users.create_user')}>
            <MainPageHeader title={i18n.t('server:users.create_new_user')}>
                <ActionButton
                    variant='secondary'
                    onClick={() => navigate(`/server/${serverId}/users`)}
                    className='flex items-center gap-2'
                    disabled={isSubmitting}
                >
                    <ChevronLeft width={22} height={22} fill='currentColor' />
                    {i18n.t('server:users.back_to_users')}
                </ActionButton>
            </MainPageHeader>

            <UserFormComponent
                onSuccess={handleSuccess}
                onCancel={handleCancel}
                flashKey='user:create'
                isSubmitting={isSubmitting}
                setIsSubmitting={setIsSubmitting}
            />
        </ServerContentBlock>
    );
};

export default CreateUserContainer;
