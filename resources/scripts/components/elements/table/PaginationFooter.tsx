import { ChevronLeft, ChevronRight } from '@gravity-ui/icons';
import clsx from 'clsx';
import type { PaginationDataSet } from '@/api/http';
import ActionButton from '@/components/elements/ActionButton';

interface Props {
    className?: string;
    onPageSelect: (page: number) => void;
    pagination: PaginationDataSet;
}

const PaginationFooter = ({ pagination, className, onPageSelect }: Props) => {
    const start = (pagination.currentPage - 1) * pagination.perPage;
    const end = (pagination.currentPage - 1) * pagination.perPage + pagination.count;

    const { currentPage: current, totalPages: total } = pagination;

    const pages = { previous: [] as number[], next: [] as number[] };
    for (let i = 1; i <= 2; i++) {
        if (current - i >= 1) {
            pages.previous.push(current - i);
        }
        if (current + i <= total) {
            pages.next.push(current + i);
        }
    }

    if (pagination.total === 0) {
        return null;
    }

    return (
        <div className={clsx('my-2 flex items-center justify-between', className)}>
            <p className={'text-sm text-zinc-500'}>
                Showing&nbsp;
                <span className={'font-semibold text-zinc-400'}>{Math.max(start, Math.min(pagination.total, 1))}</span>
                &nbsp;to&nbsp;
                <span className={'font-semibold text-zinc-400'}>{end}</span> of&nbsp;
                <span className={'font-semibold text-zinc-400'}>{pagination.total}</span> results.
            </p>
            {pagination.totalPages > 1 && (
                <div className={'flex space-x-1'}>
                    <ActionButton
                        className='flex items-center justify-center p-0'
                        disabled={current <= 1}
                        onClick={() => onPageSelect(current - 1)}
                        size='sm'
                        variant='secondary'
                    >
                        <ChevronLeft fill='currentColor' height={22} width={22} />
                    </ActionButton>
                    {pages.previous.reverse().map((value) => (
                        <ActionButton
                            className='flex h-8 w-8 items-center justify-center p-0'
                            key={`previous-${value}`}
                            onClick={() => onPageSelect(value)}
                            size='sm'
                            variant='secondary'
                        >
                            {value}
                        </ActionButton>
                    ))}
                    <ActionButton
                        className='flex h-8 w-8 items-center justify-center p-0'
                        disabled
                        size='sm'
                        variant='primary'
                    >
                        {current}
                    </ActionButton>
                    {pages.next.map((value) => (
                        <ActionButton
                            className='flex h-8 w-8 items-center justify-center p-0'
                            key={`next-${value}`}
                            onClick={() => onPageSelect(value)}
                            size='sm'
                            variant='secondary'
                        >
                            {value}
                        </ActionButton>
                    ))}
                    <ActionButton
                        className='flex items-center justify-center p-0'
                        disabled={current >= total}
                        onClick={() => onPageSelect(current + 1)}
                        size='sm'
                        variant='secondary'
                    >
                        <ChevronRight fill='currentColor' height={22} width={22} />
                    </ActionButton>
                </div>
            )}
        </div>
    );
};

export default PaginationFooter;
