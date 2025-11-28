import { useStoreActions, useStoreState } from 'easy-peasy';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import ActionButton from '@/components/elements/ActionButton';

import { getPrivacy, updatePrivacy } from '@/api/account/privacy';

import { ApplicationStore } from '@/state';

const ConfigurePrivacyForm = () => {
    const user = useStoreState((state: ApplicationStore) => state.user.data!);
    const setUser = useStoreActions((actions: ApplicationStore) => actions.user.setUserData);

    const [loading, setLoading] = useState(false);
    const isEnabled = !!user.privacyBlur;

    useEffect(() => {
        // hydrate on mount if not present
        if (typeof user.privacyBlur === 'undefined') {
            getPrivacy()
                .then((res) => {
                    setUser({ ...user, privacyBlur: res.privacy_blur });
                })
                .catch(() => {});
        }
    }, []);

    const onToggle = async () => {
        try {
            setLoading(true);
            const next = !isEnabled;
            const res = await updatePrivacy(next);
            setUser({ ...user, privacyBlur: res.privacy_blur });
            toast.success(res.privacy_blur ? 'Privacy blur enabled.' : 'Privacy blur disabled.');
        } catch (err: any) {
            toast.error('Failed to update privacy preference.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='contents'>
            <p className='text-sm'>
                When enabled, server allocations and similar sensitive data will be blurred until disabled.
            </p>
            <div className='mt-6'>
                <ActionButton variant={isEnabled ? 'danger' : 'primary'} onClick={onToggle} isLoading={loading}>
                    {isEnabled ? 'Disable Privacy Blur' : 'Enable Privacy Blur'}
                </ActionButton>
            </div>
        </div>
    );
};

export default ConfigurePrivacyForm;
