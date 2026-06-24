import { cn } from '@/lib/utils';

interface ChartBlockProps {
    children: React.ReactNode;
    className?: string;
    legend?: React.ReactNode;
    title: string;
}

// eslint-disable-next-line react/display-name
export default ({ title, legend, children, className }: ChartBlockProps) => (
    <div
        className={cn(
            'group relative flex flex-col gap-2 rounded-xl border-[#ffffff11] border-[1px] bg-[#110f0d] p-4',
            className,
        )}
    >
        <div className={'flex items-center justify-between'}>
            <h3 className={'font-extrabold text-sm'}>{title}</h3>
            {legend && <div className={'flex items-center text-sm'}>{legend}</div>}
        </div>
        <div className={'z-10 overflow-hidden rounded-lg'}>{children}</div>
    </div>
);
