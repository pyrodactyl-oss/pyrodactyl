import { Actions, useStoreActions } from 'easy-peasy';
import { QRCodeSVG } from 'qrcode.react';
import { useContext, useEffect, useState } from 'react';

import FlashMessageRender from '@/components/FlashMessageRender';
import ActionButton from '@/components/elements/ActionButton';
import CopyOnClick from '@/components/elements/CopyOnClick';
import Spinner from '@/components/elements/Spinner';
import { Dialog, DialogWrapperContext } from '@/components/elements/dialog';
import { Input } from '@/components/elements/inputs';

import asDialog from '@/hoc/asDialog';

import enableAccountTwoFactor from '@/api/account/enableAccountTwoFactor';
import getTwoFactorTokenData, { TwoFactorTokenData } from '@/api/account/getTwoFactorTokenData';

import i18n from '@/lib/i18n';

import { ApplicationStore } from '@/state';

import { useFlashKey } from '@/plugins/useFlash';

interface Props {
    onTokens: (tokens: string[]) => void;
}

const ConfigureTwoFactorForm = ({ onTokens }: Props) => {
    const [submitting, setSubmitting] = useState(false);
    const [value, setValue] = useState('');
    const [password, setPassword] = useState('');
    const [token, setToken] = useState<TwoFactorTokenData | null>(null);
    const { clearAndAddHttpError } = useFlashKey('account:two-step');
    const updateUserData = useStoreActions((actions: Actions<ApplicationStore>) => actions.user.updateUserData);

    const { close, setProps } = useContext(DialogWrapperContext);

    useEffect(() => {
        getTwoFactorTokenData()
            .then(setToken)
            .catch((error) => clearAndAddHttpError(error));
    }, []);

    useEffect(() => {
        setProps((state) => ({ ...state, preventExternalClose: submitting }));
    }, [submitting]);

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (submitting) return;

        setSubmitting(true);
        clearAndAddHttpError();
        enableAccountTwoFactor(value, password)
            .then((tokens) => {
                updateUserData({ useTotp: true });
                onTokens(tokens);
            })
            .catch((error) => {
                clearAndAddHttpError(error);
                setSubmitting(false);
            });
    };

    return (
        <form id={'enable-totp-form'} onSubmit={submit}>
            <FlashMessageRender byKey={'account:two-step'} />
            <div className={'flex items-center justify-center w-56 h-56 p-2 bg-zinc-50 shadow-sm mx-auto mt-6'}>
                {!token ? (
                    <Spinner />
                ) : (
                    <QRCodeSVG value={token.image_url_data} className={`w-full h-full shadow-none`} />
                )}
            </div>
            <CopyOnClick text={token?.secret}>
                <p className={'font-mono text-sm text-zinc-100 text-center mt-2'}>
                    {token?.secret.match(/.{1,4}/g)!.join(' ') || i18n.t('dashboard:totp_setup.loading')}
                </p>
            </CopyOnClick>
            <p id={'totp-code-description'} className={'mt-6'}>
                {i18n.t('dashboard:totp_setup.scan_instructions')}
            </p>
            <Input.Text
                aria-labelledby={'totp-code-description'}
                variant={Input.Text.Variants.Loose}
                value={value}
                onChange={(e) => setValue(e.currentTarget.value)}
                className={'mt-3'}
                placeholder={'000000'}
                type={'text'}
                inputMode={'numeric'}
                autoComplete={'one-time-code'}
                pattern={'\\d{6}'}
            />
            <label htmlFor={'totp-password'} className={'block mt-3'}>
                {i18n.t('dashboard:totp_setup.password_label')}
            </label>
            <Input.Text
                variant={Input.Text.Variants.Loose}
                className={'mt-1'}
                type={'password'}
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
            />
            <Dialog.Footer>
                <ActionButton variant='secondary' onClick={close}>
                    {i18n.t('strings:cancel')}
                </ActionButton>
                <ActionButton
                    variant='primary'
                    disabled={!token || value.length !== 6 || !password.length}
                    type={'submit'}
                    form={'enable-totp-form'}
                >
                    {i18n.t('dashboard:totp_setup.enable_button')}
                </ActionButton>
            </Dialog.Footer>
        </form>
    );
};

export default asDialog({
    title: i18n.t('dashboard:totp_setup.title'),
    description: i18n.t('dashboard:totp_setup.description'),
})(ConfigureTwoFactorForm);
