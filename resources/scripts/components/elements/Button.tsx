import clsx from 'clsx';
import styled from 'styled-components';

import Spinner from '@/components/elements/Spinner';

interface Props {
    color?: 'green' | 'red' | 'primary' | 'grey';
    isLoading?: boolean;
    isSecondary?: boolean;
    size?: 'xsmall' | 'small' | 'large' | 'xlarge';
}

const ButtonStyle = styled.button<Omit<Props, 'isLoading'>>``;

type ComponentProps = Omit<JSX.IntrinsicElements['button'], 'ref' | keyof Props> & Props;

const Button: React.FC<ComponentProps> = ({ children, isLoading, ...props }) => (
    <ButtonStyle {...props}>
        {isLoading && (
            <div className={'absolute top-0 left-0 flex h-full w-full items-center justify-center'}>
                <Spinner size={'small'} />
            </div>
        )}
        <span
            className={clsx({
                'opacity-0': isLoading,
                'pointer-events-none': isLoading,
            })}
        >
            {children}
        </span>
    </ButtonStyle>
);

type LinkProps = Omit<JSX.IntrinsicElements['a'], 'ref' | keyof Props> & Props;

const LinkButton: React.FC<LinkProps> = (props) => <ButtonStyle as={'a'} {...props} />;

export { ButtonStyle, LinkButton };
export default Button;
