import { useField } from 'formik';
import { memo, useCallback } from 'react';
import isEqual from 'react-fast-compare';

import Input from '@/components/elements/Input';
import TitledGreyBox from '@/components/elements/TitledGreyBox';

interface Props {
    children: React.ReactNode;
    className?: string;
    isEditable?: boolean;
    permissions: string[];
    title: string;
}

const PermissionTitleBox: React.FC<Props> = memo(({ isEditable, title, permissions, className, children }) => {
    const [{ value }, , { setValue }] = useField<string[]>('permissions');

    const onCheckboxClicked = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.currentTarget.checked) {
                setValue([...value, ...permissions.filter((p) => !value.includes(p))]);
            } else {
                setValue(value.filter((p) => !permissions.includes(p)));
            }
        },
        [permissions, value, setValue],
    );

    return (
        <TitledGreyBox
            className={className}
            title={
                <div className={'flex w-full items-center justify-between'}>
                    <p className={'text-sm capitalize'}>{title}</p>
                    {isEditable && (
                        <Input
                            checked={permissions.every((p) => value.includes(p))}
                            onChange={onCheckboxClicked}
                            type={'checkbox'}
                        />
                    )}
                </div>
            }
        >
            {children}
        </TitledGreyBox>
    );
}, isEqual);

PermissionTitleBox.displayName = 'PermissionTitleBox';

export default PermissionTitleBox;
