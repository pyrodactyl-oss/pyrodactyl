type Callback<T> = ((value: T) => void) | React.Dispatch<React.SetStateAction<T>>;

export interface DialogProps {
    onClose: () => void;
    open: boolean;
}

export type IconPosition = 'title' | 'container' | undefined;

export interface DialogIconProps {
    className?: string;
    position?: IconPosition;
    type: 'danger' | 'info' | 'success' | 'warning';
}

export interface RenderDialogProps extends DialogProps {
    children?: React.ReactNode;
    description?: string | undefined;
    hideCloseIcon?: boolean;
    preventExternalClose?: boolean;
    title?: string;
}

export type WrapperProps = Omit<RenderDialogProps, 'children' | 'open' | 'onClose'>;
export interface DialogWrapperContextType {
    close: () => void;
    props: Readonly<WrapperProps>;
    setProps: React.Dispatch<React.SetStateAction<WrapperProps>>;
}

export interface DialogContextType {
    setFooter: Callback<React.ReactNode>;
    setIcon: Callback<React.ReactNode>;
    setIconPosition: Callback<IconPosition>;
}
