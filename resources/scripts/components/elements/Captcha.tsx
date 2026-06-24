import { useEffect, useRef, useState } from 'react';

import CaptchaManager from '@/lib/captcha';

interface CaptchaProps {
    className?: string;
    onError?: (error: any) => void;
    onExpired?: () => void;
    onSuccess?: (token: string) => void;
    size?: 'normal' | 'compact' | 'invisible' | 'flexible';
    theme?: 'light' | 'dark' | 'auto';
}

export default function Captcha({
    onSuccess,
    onError,
    onExpired,
    className,
    theme = 'dark',
    size = 'flexible',
}: CaptchaProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [widgetId, setWidgetId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Use refs to store the latest callback values to avoid recreating the effect
    const onSuccessRef = useRef(onSuccess);
    const onErrorRef = useRef(onError);
    const onExpiredRef = useRef(onExpired);

    // Update refs when callbacks change
    useEffect(() => {
        onSuccessRef.current = onSuccess;
        onErrorRef.current = onError;
        onExpiredRef.current = onExpired;
    });

    // Stable callback functions that use refs
    const handleSuccess = (token: string) => {
        onSuccessRef.current?.(token);
    };

    const handleError = (err: any) => {
        setError('Captcha verification failed');
        onErrorRef.current?.(err);
    };

    const handleExpired = () => {
        setError('Captcha expired');
        onExpiredRef.current?.();
    };

    useEffect(() => {
        if (!CaptchaManager.isEnabled()) {
            return;
        }

        let mounted = true;

        const initializeCaptcha = async () => {
            if (!containerRef.current) return;

            // Clean up any existing widget first
            if (widgetId) {
                CaptchaManager.removeWidget();
                setWidgetId(null);
            }

            // Clear the container
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }

            setIsLoading(true);
            setError(null);

            try {
                // Load the SDK first
                await CaptchaManager.loadSdk();

                if (!mounted) return;

                // Render the widget
                const id = await CaptchaManager.renderWidget(containerRef.current, {
                    theme,
                    size,
                    onSuccess: handleSuccess,
                    onError: handleError,
                    onExpired: handleExpired,
                });

                if (mounted) {
                    setWidgetId(id);
                }
            } catch {
                if (mounted) {
                    setError('Failed to load captcha');
                }
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        initializeCaptcha();

        return () => {
            mounted = false;
            if (widgetId) {
                CaptchaManager.removeWidget();
            }
        };
    }, [theme, size, widgetId, handleSuccess, handleExpired, handleError]);

    // Set up event listeners for captcha events
    useEffect(() => {
        const handleSuccess = (_event: CustomEvent) => {
            setError(null);
        };

        const handleError = (_event: CustomEvent) => {
            setError('Captcha verification failed');
        };

        const handleExpired = (_event: CustomEvent) => {
            setError('Captcha expired');
        };

        window.addEventListener('captcha:success', handleSuccess as EventListener);
        window.addEventListener('captcha:error', handleError as EventListener);
        window.addEventListener('captcha:expired', handleExpired as EventListener);

        return () => {
            window.removeEventListener('captcha:success', handleSuccess as EventListener);
            window.removeEventListener('captcha:error', handleError as EventListener);
            window.removeEventListener('captcha:expired', handleExpired as EventListener);
        };
    }, []);

    // Don't render anything if captcha is disabled
    if (!CaptchaManager.isEnabled()) {
        return null;
    }

    return (
        <div className={className}>
            <div ref={containerRef} />
            {isLoading && <div className='mt-2 text-gray-500 text-sm'>Loading captcha...</div>}
            {error && <div className='mt-2 text-red-500 text-sm'>{error}</div>}
        </div>
    );
}

/**
 * Get the captcha response
 */
export function getCaptchaResponse(): string | null {
    if (!CaptchaManager.isEnabled()) {
        return null;
    }

    return CaptchaManager.getResponse();
}

/**
 * Reset the captcha widget
 */
export function resetCaptcha(): void {
    CaptchaManager.resetWidget();
}

/**
 * Remove the captcha widget
 */
export function removeCaptcha(): void {
    CaptchaManager.removeWidget();
}

/**
 * Create a hidden input field for form submission
 */
export function createCaptchaHiddenInput(formElement: HTMLFormElement): HTMLInputElement | null {
    return CaptchaManager.createHiddenInput(formElement);
}
