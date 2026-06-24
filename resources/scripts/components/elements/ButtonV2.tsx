import clsx from 'clsx';
import type React from 'react';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    className?: string;
}

const Button = ({ className, ...props }: Props) => (
    <button
        className={clsx(
            'flex h-8 cursor-pointer items-center justify-center rounded-full border border-[#ffffff15] bg-linear-to-b from-[#ffffff10] to-[#ffffff09] px-4 font-medium text-sm text-white shadow-xs transition-colors duration-150 hover:from-[#ffffff05] hover:to-[#ffffff04]',
            className,
        )}
        {...props}
    />
);
Button.displayName = 'Button';

export default Button;
