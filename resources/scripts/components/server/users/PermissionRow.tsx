import { useStoreState } from 'easy-peasy';

import Checkbox from '@/components/elements/Checkbox';
import Label from '@/components/elements/Label';

interface Props {
    disabled: boolean;
    permission: string;
}

const PermissionRow = ({ permission, disabled }: Props) => {
    const [key = '', pkey = ''] = permission.split('.', 2);
    const permissions = useStoreState((state) => state.permissions.data);

    return (
        <label className={disabled ? 'disabled' : undefined} htmlFor={`permission_${permission}`}>
            <div className={'flex flex-col'}>
                <div className='flex flex-row items-center'>
                    <Checkbox
                        className={'mr-2 h-4 w-4'}
                        disabled={disabled}
                        id={`permission_${permission}`}
                        name={'permissions'}
                        value={permission}
                    />
                    <Label as={'p'} className={'font-medium'}>
                        {pkey}
                    </Label>
                </div>
                <div className={'flex-1'}>
                    {(permissions[key]?.keys?.[pkey]?.length ?? 0) > 0 && (
                        <p className={'mt-1 text-neutral-400 text-xs'}>{permissions[key]?.keys?.[pkey] ?? ''}</p>
                    )}
                </div>
            </div>
        </label>
    );
};

export default PermissionRow;
