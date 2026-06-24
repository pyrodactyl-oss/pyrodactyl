'use client';

import * as SeparatorPrimitive from '@radix-ui/react-separator';
import type * as React from 'react';

import { cn } from '../../lib/utils';

const Separator = ({
    className,
    orientation = 'horizontal',
    decorative = true,
    ref,
    ...props
}: React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> & {
    ref?: React.RefObject<React.ComponentRef<typeof SeparatorPrimitive.Root> | null>;
}) => (
    <SeparatorPrimitive.Root
        className={cn(
            'shrink-0 bg-mocha-400',
            orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
            className,
        )}
        decorative={decorative}
        orientation={orientation}
        ref={ref}
        {...props}
    />
);
Separator.displayName = SeparatorPrimitive.Root.displayName;

export { Separator };
