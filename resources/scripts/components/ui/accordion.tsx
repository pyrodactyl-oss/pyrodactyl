'use client';

import { ChevronRight } from '@carbon/icons-react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import type * as React from 'react';

import { cn } from '../../lib/utils';

const Accordion = AccordionPrimitive.Root;

const AccordionItem = ({
    className,
    ref,
    ...props
}: React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item> & {
    ref?: React.RefObject<React.ComponentRef<typeof AccordionPrimitive.Item> | null>;
}) => <AccordionPrimitive.Item className={cn('', className)} ref={ref} {...props} />;
AccordionItem.displayName = 'AccordionItem';

const AccordionTrigger = ({
    className,
    children,
    ref,
    ...props
}: React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> & {
    ref?: React.RefObject<React.ComponentRef<typeof AccordionPrimitive.Trigger> | null>;
}) => (
    <AccordionPrimitive.Header className='flex'>
        <AccordionPrimitive.Trigger
            className={cn(
                'group -mx-2 flex w-full cursor-pointer justify-between gap-2 rounded border border-transparent p-2 text-left opacity-50 transition hover:text-cream-300 focus:outline-none focus-visible:border-[#6355FF] [&[data-state=open]>svg]:rotate-90 [&[data-state=open]]:opacity-100',
                className,
            )}
            ref={ref}
            {...props}
        >
            <span className='font-medium leading-6'>{children}</span>
            <ChevronRight className='h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200' />
        </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
);
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

const AccordionContent = ({
    className,
    children,
    ref,
    ...props
}: React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content> & {
    ref?: React.RefObject<React.ComponentRef<typeof AccordionPrimitive.Content> | null>;
}) => (
    <AccordionPrimitive.Content
        className='text-md data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down'
        ref={ref}
        {...props}
    >
        {/* <div className={cn("mx-4 pt-0 pb-4", className)}>{children}</div> */}
        <div className='max-w-9/10 pb-4 opacity-80'>{children}</div>
    </AccordionPrimitive.Content>
);
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
