import ActionButton from '@/components/elements/ActionButton';
import { Alert } from '@/components/elements/alert';
import CopyOnClick from '@/components/elements/CopyOnClick';
import { Dialog, type DialogProps } from '@/components/elements/dialog';

interface RecoveryTokenDialogProps extends DialogProps {
    tokens: string[];
}

const RecoveryTokensDialog = ({ tokens, open, onClose }: RecoveryTokenDialogProps) => {
    const grouped = [] as [string, string][];
    tokens.forEach((token, index) => {
        if (index % 2 === 0) {
            grouped.push([token, tokens[index + 1] || '']);
        }
    });

    return (
        <Dialog
            description={
                'Store the codes below somewhere safe. If you lose access to your authenticator app you can use these backup codes to sign in.'
            }
            hideCloseIcon
            onClose={onClose}
            open={open}
            preventExternalClose
            title={'Authenticator App Enabled'}
        >
            <Dialog.Icon position={'container'} type={'success'} />
            <CopyOnClick showInNotification={false} text={tokens.join('\n')}>
                <pre className={'mt-6 rounded-sm bg-zinc-800 p-2'}>
                    {grouped.map((value) => (
                        <span className={'block'} key={value.join('_')}>
                            {value[0]}
                            <span className={'mx-2 selection:bg-zinc-800'}>&nbsp;</span>
                            {value[1]}
                            <span className={'selection:bg-zinc-800'}>&nbsp;</span>
                        </span>
                    ))}
                </pre>
            </CopyOnClick>
            <Alert className={'mt-3'} type={'danger'}>
                These codes will not be shown again.
            </Alert>
            <Dialog.Footer>
                <ActionButton onClick={onClose} variant='primary'>
                    Done
                </ActionButton>
            </Dialog.Footer>
        </Dialog>
    );
};

export default RecoveryTokensDialog;
