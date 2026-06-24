import { Check } from '@gravity-ui/icons';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import * as React from 'react';

import { cn } from '@/lib/utils';

const Checkbox = React.forwardRef<
    React.ElementRef<typeof CheckboxPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
    <CheckboxPrimitive.Root
        className={cn(
            'peer h-5 w-5 shrink-0 rounded-md border-2 border-secondary shadow-sm focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[deepskyblue] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-brand data-[state=checked]:text-primary-foreground',
            className,
        )}
        ref={ref}
        {...props}
    >
        <CheckboxPrimitive.Indicator className={cn('flex h-full w-full items-center justify-center text-current')}>
            <Check fill='currentColor' height={22} width={22} />
        </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
