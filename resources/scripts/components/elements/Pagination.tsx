import { ArrowLeft, ArrowRight } from '@gravity-ui/icons';
import styled from 'styled-components';
import type { PaginatedResult } from '@/api/http';
import Button from '@/components/elements/Button';

interface RenderFuncProps<T> {
    isFirstPage: boolean;
    isLastPage: boolean;
    items: T[];
}

interface Props<T> {
    children: (props: RenderFuncProps<T>) => React.ReactNode;
    data: PaginatedResult<T>;
    onPageSelect: (page: number) => void;
    showGoToFirst?: boolean;
    showGoToLast?: boolean;
}

const Block = styled(Button)``;

function Pagination<T>({ data: { items, pagination }, onPageSelect, children }: Props<T>) {
    const isFirstPage = pagination.currentPage === 1;
    const isLastPage = pagination.currentPage >= pagination.totalPages;

    const pages = [];

    // Start two spaces before the current page. If that puts us before the starting page default
    // to the first page as the starting point.
    const start = Math.max(pagination.currentPage - 2, 1);
    const end = Math.min(pagination.totalPages, pagination.currentPage + 5);

    for (let i = start; i <= end; i++) {
        // @ts-expect-error - Type issue with array push
        pages.push(i);
    }

    return (
        <>
            {children({ items, isFirstPage, isLastPage })}
            {pages.length > 1 && (
                <div className={'mt-4 flex justify-center'}>
                    <div
                        className={
                            'flex w-fit justify-center gap-3 rounded-md border border-[#00000017] bg-linear-to-b from-[#ffffff10] to-[#ffffff09] p-[4px]'
                        }
                    >
                        <Block
                            color={'primary'}
                            isSecondary
                            onClick={() =>
                                pagination.currentPage > 1 &&
                                pagination.totalPages > 1 &&
                                onPageSelect(pagination.currentPage - 1)
                            }
                        >
                            <ArrowLeft
                                className={`${pagination.currentPage === 1 ? 'cursor-not-allowed text-neutral-500' : 'text-white'}`}
                                fill={'currentColor'}
                                height={22}
                                width={22}
                            />
                        </Block>
                        {pages.map((i) => (
                            <Block
                                color={'primary'}
                                isSecondary={pagination.currentPage !== i}
                                key={`block_page_${i}`}
                                onClick={() => onPageSelect(i)}
                            >
                                {i === pagination.currentPage ? (
                                    <span className='cursor-not-allowed text-neutral-500'>{i}</span>
                                ) : (
                                    i
                                )}
                            </Block>
                        ))}
                        <Block
                            color={'primary'}
                            isSecondary
                            onClick={() =>
                                pagination.currentPage < pagination.totalPages &&
                                onPageSelect(pagination.currentPage + 1)
                            }
                        >
                            <ArrowRight
                                className={`${pagination.currentPage === pagination.totalPages ? 'cursor-not-allowed text-neutral-500' : 'text-white'}`}
                                fill={'currentColor'}
                                height={22}
                                width={22}
                            />
                        </Block>
                    </div>
                </div>
            )}
        </>
    );
}

export default Pagination;
