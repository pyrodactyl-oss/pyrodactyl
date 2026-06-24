import { NavLink } from 'react-router-dom';

import ActionButton from '@/components/elements/ActionButton';

const NewFileButton = ({ id }: { id: string }) => (
    <NavLink to={`/server/${id}/files/new${window.location.hash}`}>
        <ActionButton className='rounded-l-none border-l-cream-600' size='md' variant='secondary'>
            New File
        </ActionButton>
    </NavLink>
);

export default NewFileButton;
