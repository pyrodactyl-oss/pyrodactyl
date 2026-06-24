import clsx from 'clsx';
import { forwardRef } from 'react';

import { type ButtonProps, Options } from '@/components/elements/button/types';

import styles from './style.module.css';

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ children, shape, size, variant, className, ...rest }, ref) => (
        <button
            className={clsx(
                styles.button,
                styles.primary,
                {
                    [styles.secondary]: variant === Options.Variant.Secondary,
                    [styles.square]: shape === Options.Shape.IconSquare,
                    [styles.small]: size === Options.Size.Small,
                    [styles.large]: size === Options.Size.Large,
                },
                className,
            )}
            ref={ref}
            {...rest}
        >
            {children}
        </button>
    ),
);

const TextButton = forwardRef<HTMLButtonElement, ButtonProps>(({ className, ...props }, ref) => (
    <Button className={clsx(styles.text, className)} ref={ref} {...props} />
));

const DangerButton = forwardRef<HTMLButtonElement, ButtonProps>(({ className, ...props }, ref) => (
    <Button className={clsx(styles.danger, className)} ref={ref} {...props} />
));

const _Button = Object.assign(Button, {
    Sizes: Options.Size,
    Shapes: Options.Shape,
    Variants: Options.Variant,
    Text: TextButton,
    Danger: DangerButton,
});

Button.displayName = 'Button';
TextButton.displayName = 'TextButton';
DangerButton.displayName = 'DangerButton';

export default _Button;
