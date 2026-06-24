import clsx from 'clsx';

interface Props {
    children: React.ReactNode;
    className?: string;
}

const PageListContainer = ({ className, children }: Props) => (
    <div
        className={clsx(className, 'rounded-xl border-[#ffffff12] border-[1px] p-2')}
        style={{
            background: 'radial-gradient(124.75% 124.75% at 50.01% -10.55%, rgb(16, 16, 16) 0%, rgb(4, 4, 4) 100%)',
        }}
    >
        <div className='flex h-full w-full flex-col gap-3 overflow-hidden rounded-lg'>{children}</div>
    </div>
);
PageListContainer.displayName = 'PageListContainer';

const PageListItem = ({ className, children }: Props) => (
    <div
        className={clsx(
            className,
            'flex flex-col items-center gap-3 rounded-xl border-[#ffffff15] border-[1px] bg-linear-to-b from-[#ffffff08] to-[#ffffff05] px-5 py-4 transition-all hover:border-[#ffffff20] sm:flex-row',
        )}
    >
        {children}
    </div>
);
PageListItem.displayName = 'PageListItem';

export { PageListContainer, PageListItem };
