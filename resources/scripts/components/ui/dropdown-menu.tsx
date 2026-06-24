'use client';

import { Checkmark, ChevronRight, DotMark } from '@carbon/icons-react';
// import { ChevronRight, CopyCheckXmark } from '@gravity-ui/icons';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import type * as React from 'react';

import { cn } from '../../lib/utils';

const DropdownMenu = DropdownMenuPrimitive.Root;

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuSub = DropdownMenuPrimitive.Sub;

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuSubTrigger = ({
    className,
    inset,
    children,
    ref,
    ...props
}: (React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
}) & { ref?: React.RefObject<React.ComponentRef<typeof DropdownMenuPrimitive.SubTrigger> | null> }) => (
    <DropdownMenuPrimitive.SubTrigger
        className={cn(
            'relative flex cursor-default select-none items-center rounded-xl px-2 py-1.5 text-sm outline-none focus:bg-mocha-400 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
            inset && 'pl-8',
            className,
        )}
        ref={ref}
        {...props}
    >
        {children}
        <ChevronRight className='ml-auto h-4 w-4' />
    </DropdownMenuPrimitive.SubTrigger>
);
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

const DropdownMenuSubContent = ({
    className,
    ref,
    ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent> & {
    ref?: React.RefObject<React.ComponentRef<typeof DropdownMenuPrimitive.SubContent> | null>;
}) => (
    <DropdownMenuPrimitive.SubContent
        className={cn(
            'z-50 min-w-[12rem] overflow-hidden rounded-2xl border border-mocha-400 bg-bg-lowered p-1 shadow-[#000000aa] shadow-xl',
            'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=open]:animate-in',
            className,
        )}
        ref={ref}
        {...props}
    />
);
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

const DropdownMenuContent = ({
    className,
    sideOffset = 4,
    ref,
    ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> & {
    ref?: React.RefObject<React.ComponentRef<typeof DropdownMenuPrimitive.Content> | null>;
}) => (
    <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
            className={cn(
                'z-50 min-w-[12rem] overflow-hidden rounded-2xl border border-mocha-400 bg-bg-lowered p-1 shadow-[#000000aa] shadow-xl',
                'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=open]:animate-in',
                className,
            )}
            ref={ref}
            sideOffset={sideOffset}
            {...props}
        />
    </DropdownMenuPrimitive.Portal>
);
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const DropdownMenuItem = ({
    className,
    inset,
    ref,
    ...props
}: (React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
}) & { ref?: React.RefObject<React.ComponentRef<typeof DropdownMenuPrimitive.Item> | null> }) => (
    <DropdownMenuPrimitive.Item
        className={cn(
            'relative flex cursor-default select-none items-center rounded-xl px-2 py-1.5 text-sm outline-none focus:bg-mocha-400 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
            inset && 'pl-8',
            className,
        )}
        ref={ref}
        {...props}
    />
);
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuCheckboxItem = ({
    className,
    children,
    checked,
    ref,
    ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem> & {
    ref?: React.RefObject<React.ComponentRef<typeof DropdownMenuPrimitive.CheckboxItem> | null>;
}) => (
    <DropdownMenuPrimitive.CheckboxItem
        checked={checked}
        className={cn(
            'relative flex cursor-default select-none items-center rounded-xl py-1.5 pr-2 pl-8 text-sm outline-none focus:bg-mocha-400 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
            className,
        )}
        ref={ref}
        {...props}
    >
        <span className='absolute left-2 flex h-3.5 w-3.5 items-center justify-center'>
            <DropdownMenuPrimitive.ItemIndicator>
                <Checkmark className='h-4 w-4' />
            </DropdownMenuPrimitive.ItemIndicator>
        </span>
        {children}
    </DropdownMenuPrimitive.CheckboxItem>
);
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

const DropdownMenuRadioItem = ({
    className,
    children,
    ref,
    ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem> & {
    ref?: React.RefObject<React.ComponentRef<typeof DropdownMenuPrimitive.RadioItem> | null>;
}) => (
    <DropdownMenuPrimitive.RadioItem
        className={cn(
            'relative flex cursor-default select-none items-center rounded-xl py-1.5 pr-2 pl-8 text-sm outline-none focus:bg-mocha-400 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
            className,
        )}
        ref={ref}
        {...props}
    >
        <span className='absolute left-2 flex h-3.5 w-3.5 items-center justify-center'>
            <DropdownMenuPrimitive.ItemIndicator>
                <DotMark className='size-3 fill-current' />
            </DropdownMenuPrimitive.ItemIndicator>
        </span>
        {children}
    </DropdownMenuPrimitive.RadioItem>
);
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

const DropdownMenuLabel = ({
    className,
    inset,
    ref,
    ...props
}: (React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
}) & { ref?: React.RefObject<React.ComponentRef<typeof DropdownMenuPrimitive.Label> | null> }) => (
    <DropdownMenuPrimitive.Label
        className={cn('px-2 py-1.5 font-semibold text-sm', inset && 'pl-8', className)}
        ref={ref}
        {...props}
    />
);
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = ({
    className,
    ref,
    ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator> & {
    ref?: React.RefObject<React.ComponentRef<typeof DropdownMenuPrimitive.Separator> | null>;
}) => (
    <DropdownMenuPrimitive.Separator className={cn('-mx-1 my-1 h-px bg-mocha-400', className)} ref={ref} {...props} />
);
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
    <span className={cn('ml-auto text-xs tracking-widest opacity-60', className)} {...props} />
);
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

export {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
};
