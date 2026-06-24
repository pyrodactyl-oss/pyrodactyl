import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';

import { cn } from '../../lib/utils';

const buttonVariants = cva(
    'inline-flex select-none items-center justify-center whitespace-nowrap border border-transparent border-solid font-medium text-sm ring-offset-background transition hover:cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mocha-200 hover:active:translate-y-0.5 hover:active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
    {
        variants: {
            variant: {
                default: 'bg-cream-400 text-mocha-500 shadow-sm hover:bg-cream-500/80 hover:active:bg-cream-500/70',
                destructive: 'bg-red-500 text-white shadow-sm hover:bg-red-500/90',
                attention:
                    'bg-brand-400/60 text-mocha-500 shadow-sm hover:bg-brand-400/80 hover:active:bg-brand-400/70',
                outline: 'border border-cream-400/80 hover:bg-mocha-300/50 hover:active:bg-mocha-300/20',
                secondary:
                    'border border-mocha-300 bg-mocha-400 text-cream-400 shadow-sm hover:bg-mocha-300 hover:active:bg-mocha-300/50',
                ghost: 'hover:bg-cream-400 hover:text-mocha-500 hover:active:bg-cream-400/70',
                link: 'text-cream-400 underline-offset-4 hover:underline',
                spark: 'gap-3 border-cream-500/20 bg-linear-0 from-mocha-400 to-[#433B32] text-cream-500 text-lg',
                ember_faq: 'gap-3 border-cream-500/20 bg-linear-0 from-mocha-400 to-[#433B32] text-2xl text-cream-500',
            },
            size: {
                default: 'h-10 px-4 py-2',
                sm: 'h-8 px-2',
                md: 'h-11 w-11 px-4',
                lg: 'h-14 rounded-2xl px-6 text-md',
                ember: 'h-14 rounded-2xl px-6 text-lg',
                icon: 'h-8 w-8 rounded-full',
            },
            shape: {
                default: 'rounded-xl',
                round: 'rounded-full',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
            shape: 'default',
        },
    },
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = ({
    className,
    variant,
    size,
    shape,
    asChild = false,
    ref,
    ...props
}: ButtonProps & { ref?: React.RefObject<HTMLButtonElement | null> }) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, shape, className }))} ref={ref} {...props} />;
};
Button.displayName = 'Button';

export { Button, buttonVariants };
