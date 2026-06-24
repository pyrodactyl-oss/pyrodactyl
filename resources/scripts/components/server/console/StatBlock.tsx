import CopyOnClick from '@/components/elements/CopyOnClick';

import { cn } from '@/lib/utils';

import styles from './style.module.css';

interface StatBlockProps {
    children: React.ReactNode;
    className?: string;
    copyOnClick?: string;
    title: string;
}

const StatBlock = ({ title, copyOnClick, className, children }: StatBlockProps) => (
    <CopyOnClick text={copyOnClick}>
        <div className={cn(styles.stat_block, 'border-[#ffffff11] border-[1px] bg-[#ffffff09]', className)}>
            <div className={'flex w-full flex-col justify-center overflow-hidden'}>
                <p className={'text-xs text-zinc-400 leading-tight md:text-sm'}>{title}</p>
                <div className={'w-full truncate font-extrabold text-[32px] leading-[98%] tracking-[-0.07rem]'}>
                    {children}
                </div>
            </div>
        </div>
    </CopyOnClick>
);

export default StatBlock;
