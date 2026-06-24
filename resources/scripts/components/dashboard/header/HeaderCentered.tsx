import { cn } from '@/lib/utils';

const HeaderCentered = ({ children, className = '' }) => (
    <div className='w-full xl:absolute xl:right-0 xl:left-0 xl:w-auto xl:translate-x-1/2'>
        <div
            className={cn(
                'flex h-full w-full items-center xl:absolute xl:top-1/2 xl:w-fit xl:-translate-x-1/2 xl:-translate-y-1/2',
                className,
            )}
        >
            {children}
        </div>
    </div>
);

export default HeaderCentered;
