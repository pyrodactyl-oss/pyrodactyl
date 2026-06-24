import { useEffect } from 'react';

import FlashMessageRender from '@/components/FlashMessageRender';

export interface PageContentBlockProps {
    background?: boolean;
    children?: React.ReactNode;
    className?: string;
    showFlashKey?: string;
    title: string;
}

const PageContentBlock: React.FC<PageContentBlockProps> = ({
    title,
    showFlashKey,
    className,
    children,
    background = true,
}) => {
    useEffect(() => {
        if (title) {
            document.title = `${title} | Pyrodactyl`;
        }
    }, [title]);

    return (
        <div
            className={`${className || ''} relative mx-auto flex h-full w-full max-w-[120rem] flex-1 flex-col overflow-y-auto rounded-2xl ${background ? 'border border-mocha-400 bg-bg-raised p-7' : ''}`}
        >
            {showFlashKey && <FlashMessageRender byKey={showFlashKey} />}
            {children}
        </div>
    );
};

export default PageContentBlock;
