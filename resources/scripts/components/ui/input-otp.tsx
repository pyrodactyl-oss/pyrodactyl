'use client';

import { MinusSignIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { OTPInput, OTPInputContext } from 'input-otp';
import * as React from 'react';

import { cn } from '@/lib/utils';

function InputOTP({
    className,
    containerClassName,
    ...props
}: React.ComponentProps<typeof OTPInput> & {
    containerClassName?: string;
}) {
    return (
        <OTPInput
            className={cn('disabled:cursor-not-allowed', className)}
            containerClassName={cn('flex items-center gap-2 has-disabled:opacity-50', containerClassName)}
            data-slot='input-otp'
            {...props}
        />
    );
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<'div'>) {
    return <div className={cn('flex items-center', className)} data-slot='input-otp-group' {...props} />;
}

function InputOTPSlot({
    index,
    className,
    ...props
}: React.ComponentProps<'div'> & {
    index: number;
}) {
    const inputOTPContext = React.useContext(OTPInputContext);
    const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {};

    return (
        <div
            className={cn(
                'relative flex items-center justify-center border-input border-y border-r text-xs shadow-xs outline-none transition-all first:rounded-l-xl first:border-l last:rounded-r-xl aria-invalid:border-destructive data-[active=true]:z-10 data-[active=true]:border-ring data-[active=true]:ring-[3px] data-[active=true]:ring-ring/50 data-[active=true]:aria-invalid:border-destructive data-[active=true]:aria-invalid:ring-destructive/20 dark:bg-input/30 dark:data-[active=true]:aria-invalid:ring-destructive/40',
                'size-14 border-secondary bg-bg-raised text-xl ring-amber-600',
                className,
            )}
            data-active={isActive}
            data-slot='input-otp-slot'
            {...props}
        >
            {char}
            {hasFakeCaret && (
                <div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
                    <div className='h-4 w-px animate-caret-blink bg-foreground duration-1000' />
                </div>
            )}
        </div>
    );
}

function InputOTPSeparator({ ...props }: React.ComponentProps<'div'>) {
    return (
        <div data-slot='input-otp-separator' role='separator' {...props}>
            <HugeiconsIcon icon={MinusSignIcon} />
        </div>
    );
}

export { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot };
