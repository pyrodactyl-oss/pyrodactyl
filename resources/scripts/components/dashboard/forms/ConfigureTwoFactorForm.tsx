import { useStoreState } from 'easy-peasy';
import { useEffect, useState } from 'react';

import DisableTOTPDialog from '@/components/dashboard/forms/DisableTOTPDialog';
import RecoveryTokensDialog from '@/components/dashboard/forms/RecoveryTokensDialog';
import SetupTOTPDialog from '@/components/dashboard/forms/SetupTOTPDialog';
import ActionButton from '@/components/elements/ActionButton';
import useFlash from '@/plugins/useFlash';
import type { ApplicationStore } from '@/state';

const ConfigureTwoFactorForm = () => {
    const [tokens, setTokens] = useState<string[]>([]);
    const [visible, setVisible] = useState<'enable' | 'disable' | null>(null);
    const isEnabled = useStoreState((state: ApplicationStore) => state.user.data?.useTotp);
    const { clearFlashes } = useFlash();

    useEffect(
        () => () => {
            clearFlashes('account:two-step');
        },
        [clearFlashes],
    );

    const onTokens = (tokens: string[]) => {
        setTokens(tokens);
        setVisible(null);
    };

    return (
        <div className='contents'>
            <SetupTOTPDialog onClose={() => setVisible(null)} onTokens={onTokens} open={visible === 'enable'} />
            <RecoveryTokensDialog onClose={() => setTokens([])} open={tokens.length > 0} tokens={tokens} />
            <DisableTOTPDialog onClose={() => setVisible(null)} open={visible === 'disable'} />
            <p className={'text-sm'}>
                {isEnabled
                    ? 'Your account is protected by an authenticator app.'
                    : 'You have not configured an authenticator app.'}
            </p>
            <div className={'mt-6'}>
                {isEnabled ? (
                    <ActionButton onClick={() => setVisible('disable')} variant='danger'>
                        Remove Authenticator App
                    </ActionButton>
                ) : (
                    <ActionButton onClick={() => setVisible('enable')} variant='secondary'>
                        Enable Authenticator App
                    </ActionButton>
                )}
            </div>
        </div>
    );
};

export default ConfigureTwoFactorForm;
