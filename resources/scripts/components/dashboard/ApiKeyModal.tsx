import { useContext } from 'react';
import CopyOnClick from '@/components/elements/CopyOnClick';

import FlashMessageRender from '@/components/FlashMessageRender';
import ModalContext from '@/context/ModalContext';

import asModal from '@/hoc/asModal';

import ActionButton from '../elements/ActionButton';

interface Props {
    apiKey: string;
}

const ApiKeyModal = ({ apiKey }: Props) => {
    const { dismiss } = useContext(ModalContext);

    return (
        <div className='mx-auto max-w-lg space-y-6 rounded-lg p-6 shadow-lg'>
            {/* Flash message section */}
            <FlashMessageRender byKey='account' />

            {/* Modal Header */}
            <p className='mt-2 text-sm text-white-600'>
                The API key you have requested is shown below. Please store it in a safe place, as it will not be shown
                again.
            </p>

            {/* API Key Display Section */}
            <div className='relative mt-6'>
                <pre className='overflow-x-auto rounded-lg bg-gray-900 p-4 font-mono text-white'>
                    <CopyOnClick text={apiKey}>
                        <code className='break-words text-sm'>{apiKey}</code>
                    </CopyOnClick>

                    {/* Copy button with icon */}
                    <div className='absolute top-2 right-2' />
                </pre>
            </div>

            {/* Action Buttons */}
            <div className='flex justify-end space-x-4'>
                <ActionButton className='flex items-center' onClick={() => dismiss()} type='button' variant='danger'>
                    Close
                </ActionButton>
            </div>
        </div>
    );
};

ApiKeyModal.displayName = 'ApiKeyModal';

export default asModal<Props>({
    title: 'Your API Key',
    closeOnEscape: true, // Allows closing the modal by pressing Escape
    closeOnBackground: true, // Allows closing by clicking outside the modal
})(ApiKeyModal);
