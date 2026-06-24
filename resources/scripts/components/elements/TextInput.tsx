import * as React from 'react';

import { cn } from '@/lib/utils';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => (
    <input
        className={cn(
            'flex h-8 w-full rounded-md border border-[#ffffff15] bg-linear-to-b bg-transparent from-[#ffffff10] to-[#ffffff09] px-3 py-2 text-sm ring-offset-[#ffffff15] placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#ffffff15] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            className,
        )}
        ref={ref}
        type={type}
        {...props}
    />
));
Input.displayName = 'Input';

export { Input };
