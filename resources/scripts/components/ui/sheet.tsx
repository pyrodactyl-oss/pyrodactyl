'use client';

import { Close } from '@carbon/icons-react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';

import { cn } from '../../lib/utils';

const Sheet = SheetPrimitive.Root;

const SheetTrigger = SheetPrimitive.Trigger;

const SheetClose = SheetPrimitive.Close;

const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = ({
    className,
    ref,
    ...props
}: React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay> & {
    ref?: React.RefObject<React.ComponentRef<typeof SheetPrimitive.Overlay> | null>;
}) => (
    <SheetPrimitive.Overlay
        className={cn(
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80 data-[state=closed]:animate-out data-[state=open]:animate-in',
            className,
        )}
        {...props}
        ref={ref}
    />
);
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const sheetVariants = cva(
    'fixed z-50 gap-4 bg-bg p-6 shadow-lg transition ease-in-out data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:duration-300 data-[state=open]:duration-500',
    {
        variants: {
            side: {
                top: 'data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0',
                bottom: 'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0',
                left: 'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 sm:max-w-sm',
                right: 'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 sm:max-w-sm',
            },
        },
        defaultVariants: {
            side: 'right',
        },
    },
);

interface SheetContentProps
    extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
        VariantProps<typeof sheetVariants> {}

const SheetContent = ({
    side = 'right',
    className,
    children,
    ref,
    ...props
}: SheetContentProps & { ref?: React.RefObject<React.ComponentRef<typeof SheetPrimitive.Content> | null> }) => (
    <SheetPortal>
        <SheetOverlay />
        <SheetPrimitive.Content className={cn(sheetVariants({ side }), className)} ref={ref} {...props}>
            <SheetPrimitive.Close className='absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary'>
                <Close className='h-4 w-4' />
                <span className='sr-only'>Close</span>
            </SheetPrimitive.Close>
            {children}
        </SheetPrimitive.Content>
    </SheetPortal>
);
SheetContent.displayName = SheetPrimitive.Content.displayName;

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('flex flex-col space-y-2 text-center sm:text-left', className)} {...props} />
);
SheetHeader.displayName = 'SheetHeader';

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...props} />
);
SheetFooter.displayName = 'SheetFooter';

const SheetTitle = ({
    className,
    ref,
    ...props
}: React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title> & {
    ref?: React.RefObject<React.ComponentRef<typeof SheetPrimitive.Title> | null>;
}) => <SheetPrimitive.Title className={cn('font-semibold text-cream-400 text-lg', className)} ref={ref} {...props} />;
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = ({
    className,
    ref,
    ...props
}: React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description> & {
    ref?: React.RefObject<React.ComponentRef<typeof SheetPrimitive.Description> | null>;
}) => <SheetPrimitive.Description className={cn('text-cream-400/50 text-sm', className)} ref={ref} {...props} />;
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetOverlay,
    SheetPortal,
    SheetTitle,
    SheetTrigger,
};
