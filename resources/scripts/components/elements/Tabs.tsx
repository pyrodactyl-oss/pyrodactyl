import * as TabsPrimitive from '@radix-ui/react-tabs';
import type * as React from 'react';

import { cn } from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

const TabsList = ({
    className,
    ref,
    ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
    ref?: React.RefObject<React.ElementRef<typeof TabsPrimitive.List> | null>;
}) => (
    <TabsPrimitive.List
        className={cn(
            'inline-flex h-9 items-center justify-center rounded-lg bg-[#ffffff11] p-1 text-[#ffffff88]',
            className,
        )}
        ref={ref}
        {...props}
    />
);
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = ({
    className,
    ref,
    ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
    ref?: React.RefObject<React.ElementRef<typeof TabsPrimitive.Trigger> | null>;
}) => (
    <TabsPrimitive.Trigger
        className={cn(
            'inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 font-medium text-sm ring-offset-background transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-[#ffffff23] data-[state=active]:text-[#ffffff] data-[state=active]:shadow-sm',
            className,
        )}
        ref={ref}
        {...props}
    />
);
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = ({
    className,
    ref,
    ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> & {
    ref?: React.RefObject<React.ElementRef<typeof TabsPrimitive.Content> | null>;
}) => (
    <TabsPrimitive.Content
        className={cn(
            'mt-2 ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            className,
        )}
        ref={ref}
        {...props}
    />
);
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsContent, TabsList, TabsTrigger };
