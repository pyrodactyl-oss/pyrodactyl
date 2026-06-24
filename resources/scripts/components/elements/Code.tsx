import clsx from 'clsx';

interface CodeProps {
    children: React.ReactNode;
    className?: string;
}

const Code = ({ className, children }: CodeProps) => (
    <code
        className={clsx(
            'inline-block w-fit rounded-md px-2 py-1 font-mono text-sm',
            'bg-[var(--color-mocha-600)] text-[var(--color-cream-400)]',
            'border border-[var(--color-mocha-400)]/50',
            className,
        )}
    >
        {children}
    </code>
);

export default Code;
