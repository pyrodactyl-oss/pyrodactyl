import ActionButton from '@/components/elements/ActionButton';
import Spinner from '@/components/elements/Spinner';

import { Dialog, type RenderDialogProps } from './';

type ConfirmationProps = Omit<RenderDialogProps, 'description' | 'children'> & {
    children: React.ReactNode;
    confirm?: string | undefined;
    loading?: boolean;
    onConfirmed: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
};

const ConfirmationDialog = ({ confirm = 'Okay', children, onConfirmed, loading, ...props }: ConfirmationProps) => (
    <Dialog {...props} description={typeof children === 'string' ? children : undefined}>
        {typeof children !== 'string' && children}
        <Dialog.Footer>
            <ActionButton onClick={props.onClose} variant='secondary'>
                Cancel
            </ActionButton>
            <ActionButton disabled={loading} onClick={onConfirmed} variant='danger'>
                <div className='flex items-center gap-2'>
                    {loading && <Spinner size='small' />}
                    <span>{confirm}</span>
                </div>
            </ActionButton>
        </Dialog.Footer>
    </Dialog>
);

export default ConfirmationDialog;
