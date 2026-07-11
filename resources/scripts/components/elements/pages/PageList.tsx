import clsx from 'clsx';

interface Props {
    children: React.ReactNode;
    className?: string;
}

const PageListContainer = ({ className, children }: Props) => {
    return (
        <div
            style={{
                background: 'radial-gradient(124.75% 124.75% at 50.01% -10.55%, rgb(16, 16, 16) 0%, rgb(4, 4, 4) 100%)',
            }}
            className={clsx(className, 'p-2 border-[1px] border-[#ffffff12] rounded-xl')}
        >
            <div className='flex h-full w-full flex-col gap-3 overflow-hidden rounded-lg'>{children}</div>
        </div>
    );
};
PageListContainer.displayName = 'PageListContainer';

const PageListItem = ({ className, children }: Props) => {
    return (
        <div
            className={clsx(
                className,
                // "Spotlight" hover — instant brighten when the cursor
                // arrives (`hover:duration-0`), gentle 150 ms decay back
                // to rest when it leaves. Same pattern the home-screen
                // ServerRow uses, applied here so every page that
                // renders rows through PageListItem (schedules,
                // databases, network) shares the idiom.
                'flex flex-col sm:flex-row items-center gap-3 rounded-xl border-[1px] border-[#ffffff15] bg-linear-to-b from-[#ffffff08] to-[#ffffff05] px-5 py-4 transition',
                'hover:duration-0 hover:border-[#ffffff28] hover:from-[#ffffff14] hover:to-[#ffffff0a]',
            )}
        >
            {children}
        </div>
    );
};
PageListItem.displayName = 'PageListItem';

export { PageListContainer, PageListItem };
