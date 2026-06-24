import type { ActionCreator } from 'easy-peasy';
import { useFormikContext, withFormik } from 'formik';
import { useState } from 'react';
import type { Location, RouteProps } from 'react-router-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import loginCheckpoint from '@/api/auth/loginCheckpoint';
import LoginFormContainer from '@/components/auth/LoginFormContainer';
import Button from '@/components/elements/Button';
import Field from '@/components/elements/Field';
import useFlash from '@/plugins/useFlash';
import type { FlashStore } from '@/state/flashes';

import SecondaryLink from '../ui/secondary-link';

interface Values {
    code: string;
    recoveryCode: '';
}

type OwnProps = RouteProps;

type Props = OwnProps & {
    clearAndAddHttpError: ActionCreator<FlashStore['clearAndAddHttpError']['payload']>;
};

function LoginCheckpointForm() {
    const { isSubmitting, setFieldValue } = useFormikContext<Values>();
    const [isMissingDevice, setIsMissingDevice] = useState(false);

    return (
        <LoginFormContainer className={'flex w-full flex-col'}>
            <h2 className='mb-2 font-extrabold text-xl'>Two Factor Authentication</h2>

            <div className={'mt-6'}>
                <Field
                    autoComplete={'one-time-code'}
                    autoFocus
                    description={
                        isMissingDevice
                            ? 'Enter one of the recovery codes generated when you setup 2-Factor authentication on this account in order to continue.'
                            : 'Enter the two-factor token displayed by your device.'
                    }
                    name={isMissingDevice ? 'recoveryCode' : 'code'}
                    placeholder='000000'
                    title={isMissingDevice ? 'Recovery Code' : 'Authentication Code'}
                    type={'text'}
                />
            </div>

            <div className='flex w-full items-center justify-between'>
                <Button
                    className={
                        'rounded-full bg-mocha-100 p-2 px-4 text-black ease-in-out hover:scale-102 hover:cursor-pointer hover:bg-mocha-200'
                    }
                    disabled={isSubmitting}
                    isLoading={isSubmitting}
                    size={'xlarge'}
                    type={'submit'}
                >
                    Sign in
                </Button>
                <span
                    className={
                        'block rounded-full border border-white/20 px-4 py-2.5 text-center font-medium text-white text-xs uppercase tracking-wide transition-colors duration-200 hover:bg-white/10 hover:text-white/80 focus:outline-none focus:ring-2 focus:ring-white/30'
                    }
                    onClick={() => {
                        setFieldValue('code', '');
                        setFieldValue('recoveryCode', '');
                        setIsMissingDevice((s) => !s);
                    }}
                >
                    {isMissingDevice ? 'I Have My Device' : "I've Lost My Device"}
                </span>
            </div>
            <div
                className={
                    'w-full rounded-b-lg border-0 py-2 text-right font-bold text-sm capitalize outline-hidden ring-0 hover:cursor-pointer'
                }
            >
                <SecondaryLink to='/auth/login'>Return to Login</SecondaryLink>
            </div>
        </LoginFormContainer>
    );
}

const EnhancedForm = withFormik<Props & { location: Location }, Values>({
    handleSubmit: ({ code, recoveryCode }, { setSubmitting, props: { clearAndAddHttpError, location } }) => {
        loginCheckpoint(location.state?.token || '', code, recoveryCode)
            .then((response) => {
                if (response.complete) {
                    window.location = response.intended || '/';
                    return;
                }

                setSubmitting(false);
            })
            .catch((error) => {
                console.error(error);
                setSubmitting(false);
                clearAndAddHttpError({ error });
            });
    },

    mapPropsToValues: () => ({
        code: '',
        recoveryCode: '',
    }),
})(LoginCheckpointForm);

const LoginCheckpointContainer = ({ ...props }: OwnProps) => {
    const { clearAndAddHttpError } = useFlash();

    const location = useLocation();
    const navigate = useNavigate();

    if (!location.state?.token) {
        navigate('/auth/login');

        return null;
    }

    return <EnhancedForm clearAndAddHttpError={clearAndAddHttpError} location={location} {...props} />;
};

export default LoginCheckpointContainer;
