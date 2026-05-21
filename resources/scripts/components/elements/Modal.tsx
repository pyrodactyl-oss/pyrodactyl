import { Xmark } from '@gravity-ui/icons';
import { Dialog as HDialog } from '@headlessui/react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

import ActionButton from '@/components/elements/ActionButton';
import Spinner from '@/components/elements/Spinner';
import { DialogContext, IconPosition, styles } from '@/components/elements/dialog';

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
    visible: boolean;
    onDismissed: () => void;
    appear?: boolean;
    top?: boolean;
    children?: React.ReactNode;
}

export interface ModalProps extends RequiredModalProps {
    title?: string;
    closeButton?: boolean;
    dismissable?: boolean;
    closeOnEscape?: boolean;
    closeOnBackground?: boolean;
    showSpinnerOverlay?: boolean;
    /**
     * Extra Tailwind utility classes appended to the panel. Mainly used to
     * override the default `max-w-xl` width cap for modals whose content
     * needs more room (e.g. the Change Software wizard, which has 3-col
     * grids of nest/egg cards that look cramped at 576px).
     */
    panelClassName?: string;
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
    closeOnEscape = true,
    closeOnBackground = true,
    showSpinnerOverlay,
    onDismissed,
    children,
    panelClassName,
}) => {
    const isDismissable = useMemo(() => {
        return dismissable && !showSpinnerOverlay;
    }, [dismissable, showSpinnerOverlay]);

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

    /**
     * HeadlessUI Dialog's `onClose` fires for both Escape and clicks
     * outside the Panel without telling us which one. The default
     * behaviour (treat both as a dismiss) is fine for simple confirm
     * dialogs but actively breaks multi-step flows like the change-
     * software wizard: when a click handler inside the modal runs
     * setState (advancing to the next step), React reconciles and
     * the click's original DOM target can be detached by the time
     * HeadlessUI's outside-click detector walks the ancestor chain.
     * The detector then concludes the target wasn't inside the Panel
     * and fires onClose — closing the modal even though the user
     * clicked a button INSIDE it. The visible symptom is a flicker-
     * close on every action button.
     *
     * Fix: when `closeOnBackground={false}`, we no-op the entire
     * HDialog.onClose channel (since we can't distinguish Escape from
     * outside-click) and run our own Escape listener in the effect
     * below, gated by `closeOnEscape`.
     */
    const onDialogClose = (): void => {
        if (!isDismissable) return;
        // Background close is the only path that funnels through here
        // when we trust HDialog. When the caller has opted out via
        // closeOnBackground={false}, suppress it entirely. Escape is
        // handled separately in the effect below.
        if (!closeOnBackground) return;
        return onDismissed();
    };

    // Manual Escape handler — runs whenever the modal is visible AND
    // the caller wants Escape to dismiss. Used in tandem with
    // closeOnBackground={false} to keep "Escape closes / clicks-inside
    // don't" semantics that HeadlessUI's single onClose channel can't
    // express on its own.
    useEffect(() => {
        if (!visible || !closeOnEscape || !isDismissable) return;
        // Skip when we're already delegating Escape to HDialog (i.e.
        // outside-click is also allowed) — otherwise Escape would fire
        // both handlers and we'd risk a double-dismiss flicker.
        if (closeOnBackground) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onDismissed();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [visible, closeOnEscape, closeOnBackground, isDismissable, onDismissed]);

    return (
        <>
            {showSpinnerOverlay && (
                <div
                    className={`fixed inset-0 w-full h-full rounded-sm flex items-center justify-center`}
                    style={{ background: 'rgba(0,0,0,0.75)', zIndex: 9999 }}
                >
                    <Spinner />
                </div>
            )}
            <AnimatePresence>
                {visible && (
                    <DialogContext.Provider value={{ setIcon, setFooter, setIconPosition }}>
                        <HDialog
                            static
                            as={motion.div}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            open={visible}
                            onClose={onDialogClose}
                        >
                            <div
                                style={{
                                    background:
                                        'radial-gradient(50% 50% at 50% 50%, rgba(0, 0, 0, 0.42) 0%, rgba(0, 0, 0, 0.94) 100%)',
                                }}
                                className={'fixed inset-0 backdrop-blur-xs z-9997'}
                            />
                            <div className={'fixed inset-0 overflow-y-auto z-9998'}>
                                <div
                                    ref={container}
                                    className={styles.dialogContainer}
                                    onMouseDown={onContainerClick.bind(this, true)}
                                    onMouseUp={onContainerClick.bind(this, false)}
                                >
                                    <HDialog.Panel
                                        as={motion.div}
                                        initial={'closed'}
                                        animate={down ? 'bounce' : 'open'}
                                        exit={'closed'}
                                        variants={variants}
                                        // panelClassName is appended after
                                        // styles.panel so Tailwind utilities
                                        // (e.g. max-w-5xl) take precedence
                                        // over the default max-w-xl baked
                                        // into the CSS module.
                                        className={`${styles.panel} ${panelClassName ?? ''}`}
                                    >
                                        <div className='place-content-between flex items-center m-6'>
                                            {title && <h2 className={`text-2xl text-zinc-100`}>{title}</h2>}
                                            {dismissable && (
                                                <button
                                                    onClick={onDismissed}
                                                    className={'opacity-45 hover:opacity-100 p-6 -m-6 cursor-pointer'}
                                                >
                                                    <Xmark width={22} height={22} fill='currentColor' />
                                                </button>
                                            )}
                                        </div>
                                        <div className={'flex px-6 overflow-y-auto'}>
                                            <hr
                                                style={{
                                                    boxShadow: 'inset 0 0 .4rem .4rem #fff',
                                                }}
                                            />
                                            {iconPosition === 'container' && icon}
                                            <div className={'flex-1 max-h-[70vh] min-w-0'}>
                                                <div className={'flex items-center'}>
                                                    {iconPosition !== 'container' && icon}
                                                    {children}
                                                    {/* <div className={'invisible h-6'} /> */}
                                                </div>
                                                {closeButton && (
                                                    <div className={`my-6 sm:flex items-center justify-end`}>
                                                        <ActionButton onClick={onDismissed} className={`min-w-full`}>
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
