import ModalContext from '@/context/ModalContext';
import { useContext } from 'react';

import FlashMessageRender from '@/components/FlashMessageRender';
import CopyOnClick from '@/components/elements/CopyOnClick';

import asModal from '@/hoc/asModal';

import i18n from '@/lib/i18n';

import ActionButton from '../elements/ActionButton';

interface Props {
    apiKey: string;
}

const ApiKeyModal = ({ apiKey }: Props) => {
    const { dismiss } = useContext(ModalContext);

    return (
        <div className='p-6 space-y-6 max-w-lg mx-auto rounded-lg shadow-lg'>
            <FlashMessageRender byKey='account' />
            <p className='text-sm text-white-600 mt-2'>
                {i18n.t('dashboard:api_key_modal.description')}
            </p>
            <div className='relative mt-6'>
                <pre className='bg-gray-900 text-white p-4 rounded-lg font-mono overflow-x-auto'>
                    <CopyOnClick text={apiKey}>
                        <code className='text-sm break-words'>{apiKey}</code>
                    </CopyOnClick>
                    <div className='absolute top-2 right-2'></div>
                </pre>
            </div>
            <div className='flex justify-end space-x-4'>
                <ActionButton type='button' onClick={() => dismiss()} variant='danger' className='flex items-center'>
                    {i18n.t('dashboard:api_key_modal.close_button')}
                </ActionButton>
            </div>
        </div>
    );
};

ApiKeyModal.displayName = 'ApiKeyModal';

export default asModal<Props>({
    title: i18n.t('dashboard:api_key_modal.title'),
    closeOnEscape: true,
    closeOnBackground: true,
})(ApiKeyModal);
