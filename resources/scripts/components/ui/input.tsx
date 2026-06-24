import type * as React from 'react';

import { cn } from '../../lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = ({ className, type, ref, ...props }: InputProps & { ref?: React.RefObject<HTMLInputElement | null> }) => (
    <input
        className={cn(
            'flex h-10 w-full rounded-full border border-mocha-400 bg-mocha-600 px-3 py-1 text-cream-400 text-sm transition file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-cream-400/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-mocha-200 disabled:cursor-not-allowed disabled:opacity-50',
            className,
        )}
        ref={ref}
        type={type}
        {...props}
    />
);
Input.displayName = 'Input';

export { Input };
