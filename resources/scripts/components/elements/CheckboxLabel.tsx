import * as React from 'react';

import { cn } from '@/lib/utils';

const Checkbox = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
        label?: string;
        checked?: boolean;
        onChange?: (checked: boolean) => void;
    }
>(({ label, checked = false, onChange, className, ...props }, ref) => {
    const handleClick = () => {
        onChange?.(!checked);
    };

    return (
        <div className={cn('flex select-none items-center gap-2', className)} {...props} ref={ref}>
            {label && (
                <span
                    className={cn(
                        'mb-2 inline-block w-full cursor-pointer rounded-lg px-2 py-1 transition-colors duration-200',
                        checked ? 'bg-brand/40 text-white' : 'border-transparent hover:bg-gray-700/30',
                    )}
                    onClick={handleClick}
                >
                    {label}
                </span>
            )}
        </div>
    );
});

Checkbox.displayName = 'Checkbox';

export { Checkbox };
