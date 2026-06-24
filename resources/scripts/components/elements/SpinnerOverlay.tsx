import type { SpinnerSize } from '@/components/elements/Spinner';

interface Props {
    backgroundOpacity?: number;
    children?: React.ReactNode;
    fixed?: boolean;
    size?: SpinnerSize;
    visible: boolean;
}

const SpinnerOverlay: React.FC<Props> = () => <></>;

export default SpinnerOverlay;
