import { useStoreState } from 'easy-peasy';
import { Fragment } from 'react';

import Code from '@/components/elements/Code';

type Props = Readonly<{
    byKey?: string;
}>;

const FlashMessageRender = ({ byKey }: Props) => {
    const flashes = useStoreState((state) =>
        state.flashes.items.filter((flash) => (byKey ? flash.key === byKey : true)),
    );

    const getFlashStyles = (type: string) => {
        switch (type) {
            case 'success':
                return {
                    container: 'border-brand-300/50 bg-brand-300/10',
                    title: 'text-brand-300',
                    icon: '✓',
                };
            case 'error':
                return {
                    container: 'border-brand-600/50 bg-brand-600/10',
                    title: 'text-brand-600',
                    icon: '✕',
                };
            case 'warning':
                return {
                    container: 'border-brand-500/50 bg-brand-500/10',
                    title: 'text-brand-500',
                    icon: '⚠',
                };
            default:
                return {
                    container: 'border-brand/50 bg-brand/10',
                    title: 'text-brand',
                    icon: 'ℹ',
                };
        }
    };

    return flashes.length ? (
        <div className='space-y-3'>
            {flashes.map((flash) => {
                const styles = getFlashStyles(flash.type);

                return (
                    <Fragment key={flash.id || flash.type + flash.message}>
                        <div
                            className={`flex items-start gap-3 rounded-2xl border bg-[var(--color-bg)] p-4 backdrop-blur-sm ${styles.container}transition-all duration-200 ease-in-out hover:scale-[1.02] hover:shadow-lg`}
                            role='alert'
                        >
                            <span
                                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full font-bold text-sm ${styles.title}
                            `}
                            >
                                {styles.icon}
                            </span>

                            <div className='min-w-0 flex-1'>
                                {flash.title && (
                                    <h3 className={'mb-1 font-bold text-base text-cream-400'}>{flash.title}</h3>
                                )}
                                <div className='break-words text-cream-400/80 text-sm'>
                                    <Code>{flash.message}</Code>
                                </div>
                            </div>
                        </div>
                    </Fragment>
                );
            })}
        </div>
    ) : null;
};

export default FlashMessageRender;
