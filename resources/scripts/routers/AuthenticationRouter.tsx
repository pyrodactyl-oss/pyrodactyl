import { Route, Routes } from 'react-router-dom';

import ForgotPasswordContainer from '@/components/auth/ForgotPasswordContainer';
import LoginCheckpointContainer from '@/components/auth/LoginCheckpointContainer';
import LoginContainer from '@/components/auth/LoginContainer';
import ResetPasswordContainer from '@/components/auth/ResetPasswordContainer';
import Logo from '@/components/elements/PyroLogo';
import { NotFound } from '@/components/elements/ScreenBlock';

const AuthenticationRouter = () => {
    return (
        <div
            className={
                'absolute flex h-full w-full items-center justify-center rounded-md [--page-padding:--spacing(8)]'
            }
        >
            <div
                className='pointer-events-none fixed inset-0 z-1 opacity-[0.4]'
                style={{
                    backgroundImage: 'url(/assets/auth-noise.png)',
                    backgroundSize: '1920px 1080px',
                    backgroundRepeat: 'repeat',
                    backgroundPosition: '0 0',
                }}
            />
            <div className='flex size-full'>
                <div className='z-2 flex w-full max-w-4xl items-center bg-bg-lowered px-[calc(var(--page-padding)*3)] align-middle'>
                    <Routes>
                        <Route element={<LoginContainer />} path='login' />
                        <Route element={<LoginCheckpointContainer />} path='login/checkpoint/*' />
                        <Route element={<ForgotPasswordContainer />} path='password' />
                        <Route element={<ResetPasswordContainer />} path='password/reset/:token' />
                        <Route element={<NotFound />} path='*' />
                    </Routes>
                </div>
                <div className='relative w-full'>
                    <div className='absolute top-(--page-padding) right-(--page-padding) flex h-6 items-center gap-4 text-lg'>
                        <Logo className='inset-0 flex h-full w-full' />
                        <div className='h-full border-gray-200 border-l' />
                        Games
                    </div>

                    {/* Gradients */}
                    <div className='opacity-50'>
                        <div className='absolute inset-0 bg-gradient-to-tr from-transparent via-brand-400/5 to-brand-600/10' />
                        <div className='absolute inset-0 bg-gradient-to-tr from-brand-600/10 via-brand-400/5 to-transparent' />
                        <div className='absolute top-0 left-0 h-32 w-full bg-gradient-to-b from-brand-500/13 to-transparent' />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthenticationRouter;
