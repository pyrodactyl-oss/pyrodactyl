import { Form } from 'formik';
import type { PropsWithChildren } from 'react';

import FlashMessageRender from '@/components/FlashMessageRender';

import SecondaryLink from '../ui/secondary-link';

type Props = React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement> & {
    title?: string;
};

const TitleSection = ({ title, subtitle }: { title?: string; subtitle?: string }) => (
    <div className='mb-8 space-y-2 font-medium'>
        {title && <h2 className='text-3xl'>{title}</h2>}
        {/*{subtitle && <span className='text-primary/40'>{subtitle}</span>}*/}
        {subtitle && <span className='text-secondary'>{subtitle}</span>}
    </div>
);

const ReturnToLogin = () => <SecondaryLink to='/auth/login'>Return to login</SecondaryLink>;

const LoginFormContainer = ({
    children,
    className,
    ref,
    ...props
}: PropsWithChildren<Props> & { ref?: RefObject<HTMLFormElement | null> }) => (
    <Form {...props} className={`w-full text-sm ${className || ''}`} noValidate ref={ref}>
        <FlashMessageRender />
        {children}
    </Form>
);

LoginFormContainer.displayName = 'LoginFormContainer';

export { ReturnToLogin, TitleSection };
export default LoginFormContainer;
