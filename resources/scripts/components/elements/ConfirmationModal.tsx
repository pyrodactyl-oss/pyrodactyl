import { useContext } from 'react';
import ActionButton from '@/components/elements/ActionButton';
import ModalContext from '@/context/ModalContext';

import asModal from '@/hoc/asModal';

interface Props {
    buttonText: string;
    children: React.ReactNode;
    disabled?: boolean;
    onConfirmed: () => void;
    showSpinnerOverlay?: boolean;
    title: string;
}

const ConfirmationModal: React.FC<Props> = ({ children, buttonText, onConfirmed, disabled }) => {
    const { dismiss } = useContext(ModalContext);

    return (
        <div className='flex w-full flex-col'>
            <div className={'text-zinc-300'}>{children}</div>
            <div className={'my-6 flex items-center justify-end gap-4'}>
                <ActionButton onClick={() => dismiss()} variant='secondary'>
                    Cancel
                </ActionButton>
                <ActionButton disabled={disabled} onClick={() => onConfirmed()}>
                    {buttonText}
                </ActionButton>
            </div>
        </div>
    );
};

ConfirmationModal.displayName = 'ConfirmationModal';

export default asModal<Props>((props) => ({
    title: props.title,
    showSpinnerOverlay: props.showSpinnerOverlay,
}))(ConfirmationModal);
