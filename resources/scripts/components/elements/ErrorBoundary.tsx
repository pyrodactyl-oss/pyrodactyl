import { Component, type ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
    override state: State = {
        hasError: false,
    };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    override componentDidCatch(error: Error) {
        console.error(error);
    }

    override render() {
        if (this.state.hasError) {
            return (
                <div className={'my-4 flex w-full items-center justify-center'}>
                    <div className={'flex items-center rounded-sm bg-neutral-900 p-3 text-red-500'}>
                        <p className={'text-neutral-100 text-sm'}>
                            An error was encountered by the application while rendering this view. Try refreshing the
                            page.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
