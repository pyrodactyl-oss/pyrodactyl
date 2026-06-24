export enum Shape {
    Default = 0,
    IconSquare = 1,
}

export enum Size {
    Default = 0,
    Small = 1,
    Large = 2,
}

export enum Variant {
    Primary = 0,
    Secondary = 1,
}

export const Options = { Shape, Size, Variant };

export type ButtonProps = JSX.IntrinsicElements['button'] & {
    shape?: Shape;
    size?: Size;
    variant?: Variant;
};
