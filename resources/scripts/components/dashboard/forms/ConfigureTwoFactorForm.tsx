import { useStoreState } from 'easy-peasy';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import DisableTOTPDialog from '@/components/dashboard/forms/DisableTOTPDialog';
import RecoveryTokensDialog from '@/components/dashboard/forms/RecoveryTokensDialog';
import SetupTOTPDialog from '@/components/dashboard/forms/SetupTOTPDialog';
import ActionButton from '@/components/elements/ActionButton';

import { ApplicationStore } from '@/state';

import useFlash from '@/plugins/useFlash';

const ConfigureTwoFactorForm = () => {
    const { t } = useTranslation('dashboard');
    const [tokens, setTokens] = useState<string[]>([]);
    const [visible, setVisible] = useState<'enable' | 'disable' | null>(null);
    const isEnabled = useStoreState((state: ApplicationStore) => state.user.data!.useTotp);
    const { clearFlashes } = useFlash();

    useEffect(() => {
        return () => {
            clearFlashes('account:two-step');
        };
    }, [visible]);

    const onTokens = (tokens: string[]) => {
        setTokens(tokens);
        setVisible(null);
    };

    return (
        <div className='contents'>
            <SetupTOTPDialog open={visible === 'enable'} onClose={() => setVisible(null)} onTokens={onTokens} />
            <RecoveryTokensDialog tokens={tokens} open={tokens.length > 0} onClose={() => setTokens([])} />
            <DisableTOTPDialog open={visible === 'disable'} onClose={() => setVisible(null)} />
            <p className={`text-sm`}>
                {isEnabled ? t('two_factor_form.enabled_status') : t('two_factor_form.disabled_status')}
            </p>
            <div className={`mt-6`}>
                {isEnabled ? (
                    <ActionButton variant='danger' onClick={() => setVisible('disable')}>
                        {t('two_factor_form.remove_button')}
                    </ActionButton>
                ) : (
                    <ActionButton variant='primary' onClick={() => setVisible('enable')}>
                        {t('two_factor_form.enable_button')}
                    </ActionButton>
                )}
            </div>
        </div>
    );
};

export default ConfigureTwoFactorForm;
