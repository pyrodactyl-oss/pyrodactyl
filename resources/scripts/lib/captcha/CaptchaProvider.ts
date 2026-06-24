export interface CaptchaConfig {
    enabled: boolean;
    provider: string;
    scriptIncludes: string[];
    siteKey: string;
}

export interface CaptchaProviderInterface {
    /**
     * Get the provider name
     */
    getName(): string;

    /**
     * Get the response token from the widget
     */
    getResponse(widgetId?: string): string | null;

    /**
     * Get the response field name for form submission
     */
    getResponseFieldName(): string;

    /**
     * Get the script URLs needed for this provider
     */
    getScriptUrls(): string[];

    /**
     * Check if the provider's SDK is loaded
     */
    isLoaded(): boolean;

    /**
     * Load the provider's SDK
     */
    loadSdk(): Promise<void>;

    /**
     * Remove the widget
     */
    remove(widgetId?: string): void;

    /**
     * Render the captcha widget
     */
    render(container: HTMLElement, config: CaptchaRenderConfig): Promise<string>;

    /**
     * Reset the widget
     */
    reset(widgetId?: string): void;
}

export interface CaptchaRenderConfig {
    onError?: (error: any) => void;
    onExpired?: () => void;
    onSuccess?: (token: string) => void;
    siteKey: string;
    size?: 'normal' | 'compact' | 'invisible' | 'flexible';
    theme?: 'light' | 'dark' | 'auto';
}

export abstract class BaseCaptchaProvider implements CaptchaProviderInterface {
    protected widgets: Map<string, string> = new Map();

    abstract getName(): string;
    abstract getScriptUrls(): string[];
    abstract getResponseFieldName(): string;
    abstract isLoaded(): boolean;
    abstract loadSdk(): Promise<void>;
    abstract render(container: HTMLElement, config: CaptchaRenderConfig): Promise<string>;
    abstract getResponse(widgetId?: string): string | null;
    abstract reset(widgetId?: string): void;
    abstract remove(widgetId?: string): void;

    protected setWidgetId(form: string, widgetId: string): void {
        this.widgets.set(form, widgetId);
    }

    protected getWidgetId(form: string): string | undefined {
        return this.widgets.get(form);
    }

    protected removeWidgetId(form: string): void {
        this.widgets.delete(form);
    }
}
