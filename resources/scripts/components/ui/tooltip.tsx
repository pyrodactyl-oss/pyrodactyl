'use client';

import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import type * as React from 'react';

import { cn } from '../../lib/utils';

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = ({
    className,
    sideOffset = 4,
    ref,
    ...props
}: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
    ref?: React.RefObject<React.ComponentRef<typeof TooltipPrimitive.Content> | null>;
}) => (
    <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
            className={cn(
                'fade-in-0 zoom-in-95 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 z-[9999] animate-in overflow-hidden rounded-full border border-mocha-400 bg-bg px-3 py-1.5 font-semibold text-xs shadow-[#000000aa] shadow-xl data-[state=closed]:animate-out',
                className,
            )}
            ref={ref}
            sideOffset={sideOffset}
            {...props}
        />
    </TooltipPrimitive.Portal>
);
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
