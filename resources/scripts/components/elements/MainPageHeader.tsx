import type { JSX } from 'react';
import styled from 'styled-components';

import { cn } from '@/lib/utils';

const HeaderWrapper = styled.div``;

interface MainPageHeaderProps {
    children?: React.ReactNode;
    direction?: 'row' | 'column';
    headChildren?: JSX.Element;
    title?: string;
    titleChildren?: JSX.Element;
}

export const MainPageHeader: React.FC<MainPageHeaderProps> = ({
    children,
    headChildren,
    titleChildren,
    title,
    direction = 'row',
}) => (
    <HeaderWrapper
        className={cn(
            'flex',
            direction === 'row' ? 'flex-col items-center md:flex-row' : 'flex-col items-start',
            'justify-between',
            'mt-8 mb-8 select-none gap-8 md:mt-0',
        )}
    >
        <div className='flex flex-wrap items-center gap-4'>
            <h1 className='font-extrabold text-[52px] leading-[98%] tracking-[-0.14rem]'>{title}</h1>
            <div className=''>{headChildren}</div>
            {titleChildren}
        </div>
        {children}
    </HeaderWrapper>
);
