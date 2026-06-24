import { Shield } from '@gravity-ui/icons';
import clsx from 'clsx';
import { useContext, useEffect } from 'react';

import { DialogContext, type DialogIconProps, styles } from './';

// const icons = {
//     danger: ShieldExclamationIcon,
//     warning: ExclamationIcon,
//     success: CheckIcon,
//     info: InformationCircleIcon,
// };

export default ({ type, position, className }: DialogIconProps) => {
    const { setIcon, setIconPosition } = useContext(DialogContext);

    useEffect(() => {
        // const Icon = icons[type];

        setIcon(
            <div className={clsx(styles.dialog_icon, styles[type], className)}>
                <Shield fill='currentColor' height={22} width={22} />
            </div>,
        );
    }, [
        type,
        className, // const Icon = icons[type];
        setIcon,
    ]);

    useEffect(() => {
        setIconPosition(position);
    }, [position, setIconPosition]);

    return null;
};
