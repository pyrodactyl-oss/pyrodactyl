import * as React from 'react';

const CheckboxArrow = React.forwardRef<
    React.ElementRef<'div'>,
    React.ComponentPropsWithoutRef<'div'> & {
        label?: string;
        onChange?: () => void;
        toggleable?: boolean;
    }
>(({ className, label, onChange, toggleable = true, ...props }, ref) => {
    const [checked, setChecked] = React.useState(false);

    const toggleChecked = () => {
        if (!toggleable) return;
        setChecked((prev) => {
            const newCheckedState = !prev;
            if (onChange) onChange();
            return newCheckedState;
        });
    };

    return (
        <div className='flex select-none items-center gap-2'>
            {label && (
                <span
                    className={'inline-block w-full cursor-pointer rounded-lg px-2 py-1 transition-colors duration-200'}
                    onClick={toggleChecked}
                    {...props}
                    ref={ref}
                >
                    {label}
                </span>
            )}
        </div>
    );
});

CheckboxArrow.displayName = 'CheckboxArrow';

export { CheckboxArrow };
