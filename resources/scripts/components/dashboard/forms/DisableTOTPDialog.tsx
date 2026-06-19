import { useContext, useEffect, useState } from 'react';

import FlashMessageRender from '@/components/FlashMessageRender';
import ActionButton from '@/components/elements/ActionButton';
import { Dialog, DialogWrapperContext } from '@/components/elements/dialog';
import { Input } from '@/components/elements/inputs';

import asDialog from '@/hoc/asDialog';

import disableAccountTwoFactor from '@/api/account/disableAccountTwoFactor';

import i18n from '@/lib/i18n';

import { useStoreActions } from '@/state/hooks';

import { useFlashKey } from '@/plugins/useFlash';

const DisableTOTPDialog = () => {
    const [submitting, setSubmitting] = useState(false);
    const [password, setPassword] = useState('');
    const { clearAndAddHttpError } = useFlashKey('account:two-step');
    const { close, setProps } = useContext(DialogWrapperContext);
    const updateUserData = useStoreActions((actions) => actions.user.updateUserData);

    useEffect(() => {
        setProps((state) => ({ ...state, preventExternalClose: submitting }));
    }, [submitting]);

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (submitting) return;

        setSubmitting(true);
        clearAndAddHttpError();
        disableAccountTwoFactor(password)
            .then(() => {
                updateUserData({ useTotp: false });
                close();
            })
            .catch(clearAndAddHttpError)
            .then(() => setSubmitting(false));
    };

    return (
        <form id={'disable-totp-form'} className={'mt-6'} onSubmit={submit}>
            <FlashMessageRender byKey={'account:two-step'} />
            <label className={'block pb-1'} htmlFor={'totp-password'}>
                {i18n.t('dashboard:totp_disable.password_label')}
            </label>
            <Input.Text
                id={'totp-password'}
                type={'password'}
                variant={Input.Text.Variants.Loose}
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
            />
            <Dialog.Footer>
                <ActionButton variant='secondary' onClick={close}>
                    {i18n.t('strings:cancel')}
                </ActionButton>
                <ActionButton
                    variant='danger'
                    type={'submit'}
                    form={'disable-totp-form'}
                    disabled={submitting || !password.length}
                >
                    {i18n.t('dashboard:totp_disable.disable_button')}
                </ActionButton>
            </Dialog.Footer>
        </form>
    );
};

export default asDialog({
    title: i18n.t('dashboard:totp_disable.title'),
    description: i18n.t('dashboard:totp_disable.description'),
})(DisableTOTPDialog);
