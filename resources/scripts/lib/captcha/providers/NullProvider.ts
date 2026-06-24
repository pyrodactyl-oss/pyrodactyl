import { BaseCaptchaProvider, type CaptchaRenderConfig } from '../CaptchaProvider';

export class NullProvider extends BaseCaptchaProvider {
    getName(): string {
        return 'none';
    }

    getScriptUrls(): string[] {
        return [];
    }

    getResponseFieldName(): string {
        return '';
    }

    isLoaded(): boolean {
        return true;
    }

    loadSdk(): Promise<void> {
        return Promise.resolve();
    }

    async render(_container: HTMLElement, _config: CaptchaRenderConfig): Promise<string> {
        // No-op for disabled captcha
        return '';
    }

    getResponse(_widgetId?: string): string | null {
        return null;
    }

    reset(_widgetId?: string): void {
        // No-op for disabled captcha
    }

    remove(_widgetId?: string): void {
        // No-op for disabled captcha
    }
}
