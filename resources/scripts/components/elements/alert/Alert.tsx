import { TriangleExclamation } from '@gravity-ui/icons';
import clsx from 'clsx';

interface AlertProps {
    children: React.ReactNode;
    className?: string;
    type: 'warning' | 'danger';
}

const Alert = ({ type, className, children }: AlertProps) => (
    <div
        className={clsx(
            'flex items-center rounded-md border-l-8 px-4 py-3 text-zinc-50 shadow-sm',
            {
                ['border-red-500 bg-red-500/25']: type === 'danger',
                ['border-yellow-500 bg-yellow-500/25']: type === 'warning',
            },
            className,
        )}
    >
        {type === 'danger' ? (
            <TriangleExclamation className={'mr-2 h-6 w-6 text-red-400'} fill='currentColor' height={22} width={22} />
        ) : (
            <TriangleExclamation className='mr-3 pl-2 text-yellow-500' fill='currentColor' height={22} width={22} />
        )}
        {children}
    </div>
);

export default Alert;
