import clsx from 'clsx';

import styles from './styles.module.css';

type Props = Omit<React.ComponentProps<'input'>, 'type'> & {
    label?: string; // Optional label text for better accessibility
    inputField?: boolean; // Optional flag to display an input field
};

const CheckBox = ({
    className,
    label,
    inputField,
    ref,
    ...props
}: Props & { ref?: RefObject<HTMLInputElement | null> }) => (
    <div className={clsx('flex items-center', className)}>
        <input
            className={clsx(
                'form-input',
                styles.checkbox_input,
                'accent-branding', // Use the custom branding color for the checkbox accent
                {
                    [styles.with_input]: inputField, // Add custom styles when the input field is enabled
                },
            )}
            ref={ref}
            type='checkbox'
            {...props}
        />
        {label && <label className={clsx('ml-2', styles.label)}>{label}</label>}
        {inputField && <input className={clsx('ml-2', 'form-input', styles.input_field, 'border-brand')} type='text' />}
    </div>
);

CheckBox.displayName = 'CheckBox';

export default CheckBox;
