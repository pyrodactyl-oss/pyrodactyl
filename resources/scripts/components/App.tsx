// Because of how react-router, react lazy, and signals work with each other
// the only way to prevent mismatching and weird errors is to import the lib
// in the root first. The github issue for this is still open. Stupid.
// https://github.com/preactjs/signals/issues/414
import GlobalStylesheet from '@/assets/css/GlobalStylesheet';
import '@/assets/tailwind.css';
import '@preact/signals-react';
import { StoreProvider } from 'easy-peasy';
import { lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';

import AuthenticatedRoute from '@/components/elements/AuthenticatedRoute';
import { NotFound } from '@/components/elements/ScreenBlock';
import Spinner from '@/components/elements/Spinner';

import { store } from '@/state';
import { ServerContext } from '@/state/server';
import type { SiteSettings } from '@/state/settings';

import PyrodactylProvider from './PyrodactylProvider';

// const DashboardRouter = lazy(() => import('@/routers/DashboardRouter'));
// const ServerRouter = lazy(() => import('@/routers/ServerRouter'));
const UnifiedRouter = lazy(() => import('@/routers/UnifiedRouter'));
const AuthenticationRouter = lazy(() => import('@/routers/AuthenticationRouter'));

interface ExtendedWindow extends Window {
    PyrodactylUser?: {
        uuid: string;
        username: string;
        email: string;

        root_admin: boolean;
        use_totp: boolean;
        language: string;
        updated_at: string;
        created_at: string;
    };
    SiteConfiguration?: SiteSettings;
}

const App = () => {
    const { PyrodactylUser, SiteConfiguration } = window as ExtendedWindow;
    if (PyrodactylUser && !store.getState().user.data) {
        store.getActions().user.setUserData({
            uuid: PyrodactylUser.uuid,
            username: PyrodactylUser.username,
            email: PyrodactylUser.email,
            language: PyrodactylUser.language,
            rootAdmin: PyrodactylUser.root_admin,
            useTotp: PyrodactylUser.use_totp,
            createdAt: new Date(PyrodactylUser.created_at),
            updatedAt: new Date(PyrodactylUser.updated_at),
        });
    }

    if (!store.getState().settings.data) {
        store.getActions().settings.setSettings(SiteConfiguration!);
    }

    return (
        <>
            <GlobalStylesheet />
            <StoreProvider store={store}>
                <PyrodactylProvider>
                    <div
                        className='relative flex h-full w-full flex-row overflow-hidden rounded-lg p-2'
                        data-pyro-routerwrap=''
                    >
                        <Toaster
                            theme='dark'
                            toastOptions={{
                                unstyled: true,
                                classNames: {
                                    toast: 'p-4 bg-[#ffffff09] border border-[#ffffff12] rounded-2xl shadow-lg backdrop-blur-2xl flex items-center w-full gap-2',
                                },
                            }}
                        />
                        <BrowserRouter>
                            <Routes>
                                <Route
                                    element={
                                        <Spinner.Suspense>
                                            <AuthenticationRouter />
                                        </Spinner.Suspense>
                                    }
                                    path='/auth/*'
                                />

                                <Route
                                    element={
                                        <AuthenticatedRoute>
                                            <Spinner.Suspense>
                                                <ServerContext.Provider>
                                                    <UnifiedRouter />
                                                </ServerContext.Provider>
                                            </Spinner.Suspense>
                                        </AuthenticatedRoute>
                                    }
                                    path='/*'
                                />

                                {/* <Route */}
                                {/*     path='/*' */}
                                {/*     element={ */}
                                {/*         <AuthenticatedRoute> */}
                                {/*             <Spinner.Suspense> */}
                                {/*                 <DashboardRouter /> */}
                                {/*             </Spinner.Suspense> */}
                                {/*         </AuthenticatedRoute> */}
                                {/*     } */}
                                {/* /> */}

                                <Route element={<NotFound />} path='*' />
                            </Routes>
                        </BrowserRouter>
                    </div>
                </PyrodactylProvider>
            </StoreProvider>
        </>
    );
};

export default App;
