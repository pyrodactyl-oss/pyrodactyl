// FIXME: replace with radix tooltip
// import Tooltip from '@/components/elements/tooltip/Tooltip';
import { type Actions, useStoreActions } from 'easy-peasy';
import { QRCodeSVG } from 'qrcode.react';
import { useContext, useEffect, useState } from 'react';
import enableAccountTwoFactor from '@/api/account/enableAccountTwoFactor';
import getTwoFactorTokenData, { type TwoFactorTokenData } from '@/api/account/getTwoFactorTokenData';
import ActionButton from '@/components/elements/ActionButton';
import CopyOnClick from '@/components/elements/CopyOnClick';
import { Dialog, DialogWrapperContext } from '@/components/elements/dialog';
import { Input } from '@/components/elements/inputs';
import Spinner from '@/components/elements/Spinner';
import FlashMessageRender from '@/components/FlashMessageRender';
import asDialog from '@/hoc/asDialog';
import { useFlashKey } from '@/plugins/useFlash';
import type { ApplicationStore } from '@/state';

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
    }, [clearAndAddHttpError]);

    useEffect(() => {
        setProps((state) => ({ ...state, preventExternalClose: submitting }));
    }, [submitting, setProps]);

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
            <div className={'mx-auto mt-6 flex h-56 w-56 items-center justify-center bg-zinc-50 p-2 shadow-sm'}>
                {token ? (
                    <QRCodeSVG className={'h-full w-full shadow-none'} value={token.image_url_data} />
                ) : (
                    <Spinner />
                )}
            </div>
            <CopyOnClick text={token?.secret}>
                <p className={'mt-2 text-center font-mono text-sm text-zinc-100'}>
                    {token?.secret.match(/.{1,4}/g)?.join(' ') || 'Loading...'}
                </p>
            </CopyOnClick>
            <p className={'mt-6'} id={'totp-code-description'}>
                Scan the QR code above using an authenticator app, or enter the secret code above. Then, enter the
                6-digit code it generates below.
            </p>
            <Input.Text
                aria-labelledby={'totp-code-description'}
                autoComplete={'one-time-code'}
                className={'mt-3'}
                inputMode={'numeric'}
                onChange={(e) => setValue(e.currentTarget.value)}
                pattern={'\\d{6}'}
                placeholder={'000000'}
                type={'text'}
                value={value}
                variant={Input.Text.Variants.Loose}
            />
            <label className={'mt-3 block'} htmlFor={'totp-password'}>
                Account Password
            </label>
            <Input.Text
                className={'mt-1'}
                onChange={(e) => setPassword(e.currentTarget.value)}
                type={'password'}
                value={password}
                variant={Input.Text.Variants.Loose}
            />
            <Dialog.Footer>
                <ActionButton onClick={close} variant='secondary'>
                    Cancel
                </ActionButton>
                {/* <Tooltip
                    disabled={password.length > 0 && value.length === 6}
                    content={
                        !token
                            ? 'Waiting for QR code to load...'
                            : 'You must enter the 6-digit code and your password to continue.'
                    }
                    delay={100}
                > */}
                <ActionButton
                    disabled={!token || value.length !== 6 || !password.length}
                    form={'enable-totp-form'}
                    type={'submit'}
                    variant='primary'
                >
                    Enable
                </ActionButton>
                {/* </Tooltip> */}
            </Dialog.Footer>
        </form>
    );
};

export default asDialog({
    title: 'Enable Authenticator App',
    description: "You'll be required to enter a verification code each time you sign in.",
})(ConfigureTwoFactorForm);
