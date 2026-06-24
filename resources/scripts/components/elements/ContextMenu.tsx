import { Check, ChevronsRight, CircleFill } from '@gravity-ui/icons';
import * as ContextMenuPrimitive from '@radix-ui/react-context-menu';
import * as React from 'react';

import { cn } from '@/lib/utils';

const ContextMenu = ContextMenuPrimitive.Root;

const ContextMenuTrigger = ContextMenuPrimitive.Trigger;

const ContextMenuGroup = ContextMenuPrimitive.Group;

const ContextMenuPortal = ContextMenuPrimitive.Portal;

const ContextMenuSub = ContextMenuPrimitive.Sub;

const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup;

const ContextMenuSubTrigger = React.forwardRef<
    React.ElementRef<typeof ContextMenuPrimitive.SubTrigger>,
    React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubTrigger> & {
        inset?: boolean;
    }
>(({ className, inset, children, ...props }, ref) => (
    <ContextMenuPrimitive.SubTrigger
        className={cn(
            'flex cursor-default select-none items-center rounded-xs px-2 py-1.5 text-sm outline-hidden focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
            inset && 'pl-8',
            className,
        )}
        ref={ref}
        {...props}
    >
        {children}
        <ChevronsRight className='ml-auto' height={22} width={22} />
    </ContextMenuPrimitive.SubTrigger>
));
ContextMenuSubTrigger.displayName = ContextMenuPrimitive.SubTrigger.displayName;

const ContextMenuSubContent = React.forwardRef<
    React.ElementRef<typeof ContextMenuPrimitive.SubContent>,
    React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
    <ContextMenuPrimitive.SubContent
        className={cn(
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[14rem] overflow-hidden rounded-xl bg-[radial-gradient(124.75%_124.75%_at_50.01%_-10.55%,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0.02)_100%)] p-2 shadow-lg backdrop-blur-2xl data-[state=closed]:animate-out data-[state=open]:animate-in',
            className,
        )}
        ref={ref}
        {...props}
    />
));
ContextMenuSubContent.displayName = ContextMenuPrimitive.SubContent.displayName;

const ContextMenuContent = React.forwardRef<
    React.ElementRef<typeof ContextMenuPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
    <ContextMenuPrimitive.Portal>
        <ContextMenuPrimitive.Content
            className={cn(
                'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[14rem] overflow-hidden rounded-xl bg-[radial-gradient(124.75%_124.75%_at_50.01%_-10.55%,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0.02)_100%)] p-2 shadow-md backdrop-blur-2xl data-[state=closed]:animate-out data-[state=open]:animate-in',
                className,
            )}
            ref={ref}
            {...props}
        />
    </ContextMenuPrimitive.Portal>
));
ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName;

const ContextMenuItem = React.forwardRef<
    React.ElementRef<typeof ContextMenuPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item> & {
        inset?: boolean;
    }
>(({ className, inset, ...props }, ref) => (
    <ContextMenuPrimitive.Item
        className={cn(
            'relative flex cursor-default select-none items-center rounded-lg px-2 py-1.5 font-bold text-sm outline-hidden transition focus:bg-[#ffffff33] focus:duration-0 data-disabled:pointer-events-none data-disabled:opacity-50',
            inset && 'pl-8',
            className,
        )}
        ref={ref}
        {...props}
    />
));
ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName;

const ContextMenuCheckboxItem = React.forwardRef<
    React.ElementRef<typeof ContextMenuPrimitive.CheckboxItem>,
    React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
    <ContextMenuPrimitive.CheckboxItem
        checked={checked}
        className={cn(
            'relative flex cursor-default select-none items-center rounded-xs py-1.5 pr-2 pl-8 text-sm outline-hidden transition focus:bg-[#ffffff33] focus:text-accent-foreground focus:duration-0 data-disabled:pointer-events-none data-disabled:opacity-50',
            className,
        )}
        ref={ref}
        {...props}
    >
        <span className='absolute left-2 flex h-3.5 w-3.5 items-center justify-center'>
            <ContextMenuPrimitive.ItemIndicator>
                <Check height={22} width={22} />
            </ContextMenuPrimitive.ItemIndicator>
        </span>
        {children}
    </ContextMenuPrimitive.CheckboxItem>
));
ContextMenuCheckboxItem.displayName = ContextMenuPrimitive.CheckboxItem.displayName;

const ContextMenuRadioItem = React.forwardRef<
    React.ElementRef<typeof ContextMenuPrimitive.RadioItem>,
    React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
    <ContextMenuPrimitive.RadioItem
        className={cn(
            'relative flex cursor-default select-none items-center rounded-xs py-1.5 pr-2 pl-8 text-sm outline-hidden transition focus:bg-[#ffffff33] focus:text-accent-foreground focus:duration-0 data-disabled:pointer-events-none data-disabled:opacity-50',
            className,
        )}
        ref={ref}
        {...props}
    >
        <span className='absolute left-2 flex h-3.5 w-3.5 items-center justify-center'>
            <ContextMenuPrimitive.ItemIndicator>
                <CircleFill className='fill-current' height={22} width={22} />
            </ContextMenuPrimitive.ItemIndicator>
        </span>
        {children}
    </ContextMenuPrimitive.RadioItem>
));
ContextMenuRadioItem.displayName = ContextMenuPrimitive.RadioItem.displayName;

const ContextMenuLabel = React.forwardRef<
    React.ElementRef<typeof ContextMenuPrimitive.Label>,
    React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label> & {
        inset?: boolean;
    }
>(({ className, inset, ...props }, ref) => (
    <ContextMenuPrimitive.Label
        className={cn('px-2 py-1.5 font-semibold text-foreground text-sm', inset && 'pl-8', className)}
        ref={ref}
        {...props}
    />
));
ContextMenuLabel.displayName = ContextMenuPrimitive.Label.displayName;

const ContextMenuSeparator = React.forwardRef<
    React.ElementRef<typeof ContextMenuPrimitive.Separator>,
    React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
    <ContextMenuPrimitive.Separator className={cn('-mx-1 my-1 h-px bg-border', className)} ref={ref} {...props} />
));
ContextMenuSeparator.displayName = ContextMenuPrimitive.Separator.displayName;

const ContextMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
    <span className={cn('ml-auto text-muted-foreground text-xs tracking-widest', className)} {...props} />
);
ContextMenuShortcut.displayName = 'ContextMenuShortcut';

export {
    ContextMenu,
    ContextMenuCheckboxItem,
    ContextMenuContent,
    ContextMenuGroup,
    ContextMenuItem,
    ContextMenuLabel,
    ContextMenuPortal,
    ContextMenuRadioGroup,
    ContextMenuRadioItem,
    ContextMenuSeparator,
    ContextMenuShortcut,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
};
