import { Xmark } from '@gravity-ui/icons';
import { Dialog as HDialog } from '@headlessui/react';
import { AnimatePresence, motion } from 'motion/react';
import { useRef, useState } from 'react';

import { DialogContext, type IconPosition, type RenderDialogProps, styles } from './';

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

const Dialog = ({
    open,
    title,
    description,
    onClose,
    hideCloseIcon,
    preventExternalClose,
    children,
}: RenderDialogProps) => {
    const container = useRef<HTMLDivElement>(null);
    const [icon, setIcon] = useState<React.ReactNode>();
    const [footer, setFooter] = useState<React.ReactNode>();
    const [iconPosition, setIconPosition] = useState<IconPosition>('title');
    const [down, setDown] = useState(false);

    const onContainerClick = (down: boolean, e: React.MouseEvent<HTMLDivElement>): void => {
        if (e.target instanceof HTMLElement && container.current?.isSameNode(e.target)) {
            setDown(down);
        }
    };

    const onDialogClose = (): void => {
        if (!preventExternalClose) {
            return onClose();
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <DialogContext.Provider value={{ setIcon, setFooter, setIconPosition }}>
                    <HDialog
                        animate={{ opacity: 1 }}
                        as={motion.div}
                        exit={{ opacity: 0 }}
                        initial={{ opacity: 0 }}
                        onClose={onDialogClose}
                        open={open}
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
                                    <div className={'flex overflow-y-auto p-6 pb-0'}>
                                        {iconPosition === 'container' && icon}
                                        <div className={'max-h-[70vh] min-w-0 flex-1'}>
                                            <div className={'flex items-center'}>
                                                {iconPosition !== 'container' && icon}
                                                <div>
                                                    {title && (
                                                        <HDialog.Title className={styles.title}>{title}</HDialog.Title>
                                                    )}
                                                    {description && (
                                                        <HDialog.Description>{description}</HDialog.Description>
                                                    )}
                                                </div>
                                            </div>
                                            {children}
                                            <div className={'invisible h-6'} />
                                        </div>
                                    </div>
                                    {footer}
                                    {/* Keep this below the other buttons so that it isn't the default focus if they're present. */}
                                    {!hideCloseIcon && (
                                        <div className={'absolute top-0 right-0 m-4 p-2 opacity-45 hover:opacity-100'}>
                                            <button className='cursor-pointer' onClick={onClose}>
                                                <Xmark fill='currentColor' height={22} width={22} />
                                            </button>
                                        </div>
                                    )}
                                </HDialog.Panel>
                            </div>
                        </div>
                    </HDialog>
                </DialogContext.Provider>
            )}
        </AnimatePresence>
    );
};

export default Dialog;
