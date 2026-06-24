'use client';

import * as SwitchPrimitives from '@radix-ui/react-switch';
import type * as React from 'react';

import { cn } from '@/lib/utils';

const Switch = ({
    className,
    ref,
    ...props
}: React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & {
    ref?: React.RefObject<React.ElementRef<typeof SwitchPrimitives.Root> | null>;
}) => (
    <SwitchPrimitives.Root
        className={cn(
            'peer inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full bg-linear-to-b from-[#ffffff0f] to-[#ffffff0a] p-px transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
            'data-[state=checked]:bg-[#fa4f49f5]',
            className,
        )}
        {...props}
        ref={ref}
    >
        <SwitchPrimitives.Thumb
            className={cn(
                'pointer-events-none block h-6 w-6 rounded-full border bg-linear-to-br from-[#ffffffcf] to-[#ffffffa1] shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-7 data-[state=unchecked]:translate-x-0.5',
            )}
        />
    </SwitchPrimitives.Root>
);
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
