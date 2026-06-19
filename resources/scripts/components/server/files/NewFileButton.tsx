import { FilePlus } from '@gravity-ui/icons';
import { NavLink } from 'react-router-dom';

import i18n from '@/lib/i18n';

import ActionButton from '@/components/elements/ActionButton';

const NewFileButton = ({ id }: { id: string }) => {
    return (
        <NavLink to={`/server/${id}/files/new${window.location.hash}`}>
            <ActionButton variant='secondary' size='md' title={i18n.t('server:files.new_file')}>
                <FilePlus className='h-4 w-4' />
            </ActionButton>
        </NavLink>
    );
};

export default NewFileButton;
