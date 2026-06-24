import { Xmark } from '@gravity-ui/icons';
import { Dialog as HDialog } from '@headlessui/react';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

import ActionButton from '@/components/elements/ActionButton';
import { DialogContext, type IconPosition, styles } from '@/components/elements/dialog';
import Spinner from '@/components/elements/Spinner';

const variants = {
    open: {
        scale: 1,
        opacity: 1,
        transition: {
            type: 'spring',
            damping: 20,
            stiffness: 300,
            duration: 0.15,
        },
    },
    closed: {
        scale: 0.75,
        opacity: 0,
        transition: {
            type: 'easeIn',
            duration: 0.15,
        },
    },
    bounce: {
        scale: 0.95,
        opacity: 1,
        transition: { type: 'linear', duration: 0.075 },
    },
};

export interface RequiredModalProps {
    appear?: boolean;
    children?: React.ReactNode;
    onDismissed: () => void;
    top?: boolean;
    visible: boolean;
}

export interface ModalProps extends RequiredModalProps {
    closeButton?: boolean;
    closeOnBackground?: boolean;
    closeOnEscape?: boolean;
    dismissable?: boolean;
    showSpinnerOverlay?: boolean;
    title?: string;
}

export const ModalMask = styled.div`
    background: radial-gradient(50% 50% at 50% 50%, rgba(0, 0, 0, 0.42) 0%, rgba(0, 0, 0, 0.94) 100%);
    position: fixed;
    z-index: 9997;
    overflow: auto;
    flex: 1;
    inset: 0;
    backdrop-filter: blur(3px);
`;

const Modal: React.FC<ModalProps> = ({
    title,
    visible,
    closeButton,
    dismissable = true,
    showSpinnerOverlay,
    onDismissed,
    children,
}) => {
    const isDismissable = useMemo(() => dismissable && !showSpinnerOverlay, [dismissable, showSpinnerOverlay]);

    const container = useRef<HTMLDivElement>(null);
    const [icon, setIcon] = useState<React.ReactNode>();
    const [_, setFooter] = useState<React.ReactNode>();
    const [iconPosition, setIconPosition] = useState<IconPosition>('title');
    const [down, setDown] = useState(false);

    const onContainerClick = (down: boolean, e: React.MouseEvent<HTMLDivElement>): void => {
        if (e.target instanceof HTMLElement && container.current?.isSameNode(e.target)) {
            setDown(down);
        }
    };

    const onDialogClose = (): void => {
        if (isDismissable) {
            return onDismissed();
        }
    };

    return (
        <>
            {showSpinnerOverlay && (
                <div
                    className={'fixed inset-0 flex h-full w-full items-center justify-center rounded-sm'}
                    style={{ background: 'rgba(0,0,0,0.75)', zIndex: 9999 }}
                >
                    <Spinner />
                </div>
            )}
            <AnimatePresence>
                {visible && (
                    <DialogContext.Provider value={{ setIcon, setFooter, setIconPosition }}>
                        <HDialog
                            animate={{ opacity: 1 }}
                            as={motion.div}
                            exit={{ opacity: 0 }}
                            initial={{ opacity: 0 }}
                            onClose={onDialogClose}
                            open={visible}
                            static
                            transition={{ duration: 0.15 }}
                        >
                            <div
                                className={'fixed inset-0 z-9997 backdrop-blur-xs'}
                                style={{
                                    background:
                                        'radial-gradient(50% 50% at 50% 50%, rgba(0, 0, 0, 0.42) 0%, rgba(0, 0, 0, 0.94) 100%)',
                                }}
                            />
                            <div className={'fixed inset-0 z-9998 overflow-y-auto'}>
                                <div
                                    className={styles.dialogContainer}
                                    onMouseDown={onContainerClick.bind(this, true)}
                                    onMouseUp={onContainerClick.bind(this, false)}
                                    ref={container}
                                >
                                    <HDialog.Panel
                                        animate={down ? 'bounce' : 'open'}
                                        as={motion.div}
                                        className={styles.panel}
                                        exit={'closed'}
                                        initial={'closed'}
                                        variants={variants}
                                    >
                                        <div className='m-6 flex place-content-between items-center'>
                                            {title && <h2 className={'text-2xl text-zinc-100'}>{title}</h2>}
                                            {dismissable && (
                                                <button
                                                    className={'-m-6 cursor-pointer p-6 opacity-45 hover:opacity-100'}
                                                    onClick={onDismissed}
                                                >
                                                    <Xmark fill='currentColor' height={22} width={22} />
                                                </button>
                                            )}
                                        </div>
                                        <div className={'flex overflow-y-auto px-6'}>
                                            <hr
                                                style={{
                                                    boxShadow: 'inset 0 0 .4rem .4rem #fff',
                                                }}
                                            />
                                            {iconPosition === 'container' && icon}
                                            <div className={'max-h-[70vh] min-w-0 flex-1'}>
                                                <div className={'flex items-center'}>
                                                    {iconPosition !== 'container' && icon}
                                                    {children}
                                                    {/* <div className={'invisible h-6'} /> */}
                                                </div>
                                                {closeButton && (
                                                    <div className={'my-6 items-center justify-end sm:flex'}>
                                                        <ActionButton className={'min-w-full'} onClick={onDismissed}>
                                                            <div>Close</div>
                                                        </ActionButton>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </HDialog.Panel>
                                </div>
                            </div>
                        </HDialog>
                    </DialogContext.Provider>
                )}
            </AnimatePresence>
        </>
    );
};

export default Modal;
