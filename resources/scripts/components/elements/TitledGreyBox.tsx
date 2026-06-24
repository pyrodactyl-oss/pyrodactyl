import { memo } from 'react';
import isEqual from 'react-fast-compare';

import { cn } from '@/lib/utils';

interface Props {
    children: React.ReactNode;
    className?: string;
    title?: string | React.ReactNode;
}

const TitledGreyBox = ({ title, children, className }: Props) => (
    <div
        className={cn(
            'relative overflow-hidden rounded-xl border-[#ffffff07] border-[1px] bg-[#ffffff08] p-8 shadow-md',
            className,
        )}
    >
        {title && (
            <div>
                {typeof title === 'string' ? (
                    <p className={'mb-4 font-extrabold text-xl tracking-tight'}>{title}</p>
                ) : (
                    title
                )}
            </div>
        )}
        <div className='h-full w-full'>{children}</div>
    </div>
);

export default memo(TitledGreyBox, isEqual);
