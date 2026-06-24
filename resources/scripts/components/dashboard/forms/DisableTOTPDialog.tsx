// FIXME: replace with radix tooltip
// import Tooltip from '@/components/elements/tooltip/Tooltip';
import { useContext, useEffect, useState } from 'react';
import disableAccountTwoFactor from '@/api/account/disableAccountTwoFactor';
import ActionButton from '@/components/elements/ActionButton';
import { Dialog, DialogWrapperContext } from '@/components/elements/dialog';
import { Input } from '@/components/elements/inputs';
import FlashMessageRender from '@/components/FlashMessageRender';
import asDialog from '@/hoc/asDialog';
import { useFlashKey } from '@/plugins/useFlash';
import { useStoreActions } from '@/state/hooks';

const DisableTOTPDialog = () => {
    const [submitting, setSubmitting] = useState(false);
    const [password, setPassword] = useState('');
    const { clearAndAddHttpError } = useFlashKey('account:two-step');
    const { close, setProps } = useContext(DialogWrapperContext);
    const updateUserData = useStoreActions((actions) => actions.user.updateUserData);

    useEffect(() => {
        setProps((state) => ({ ...state, preventExternalClose: submitting }));
    }, [submitting, setProps]);

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
        <form className={'mt-6'} id={'disable-totp-form'} onSubmit={submit}>
            <FlashMessageRender byKey={'account:two-step'} />
            <label className={'block pb-1'} htmlFor={'totp-password'}>
                Password
            </label>
            <Input.Text
                id={'totp-password'}
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
                    delay={100}
                    disabled={password.length > 0}
                    content={'You must enter your account password to continue.'}
                > */}
                <ActionButton
                    disabled={submitting || !password.length}
                    form={'disable-totp-form'}
                    type={'submit'}
                    variant='danger'
                >
                    Disable
                </ActionButton>
                {/* </Tooltip> */}
            </Dialog.Footer>
        </form>
    );
};

export default asDialog({
    title: 'Remove Authenticator App',
    description: 'Removing your authenticator app will make your account less secure.',
})(DisableTOTPDialog);
