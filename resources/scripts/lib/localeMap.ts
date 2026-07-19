import type { Locale } from 'date-fns';

import i18n from './i18n';

const dateLocaleCache: Record<string, Locale> = {};
const cronstrueLocaleCache: Record<string, string> = {};

export function getDateLocale(): Locale | undefined {
    return dateLocaleCache[i18n.language];
}

export function getCronstrueLocale(): string | undefined {
    return cronstrueLocaleCache[i18n.language];
}

export async function loadLocaleForLanguage(code: string): Promise<void> {
    // English is the default — no locale import needed, dates naturally format in English
    if (code === 'en') return;

    if (!dateLocaleCache[code]) {
        try {
            const mod = await import(`date-fns/locale/${code}`);
            dateLocaleCache[code] = (mod as Record<string, Locale>)[code] || (mod as { default: Locale }).default || mod as Locale;
        } catch {
            // date-fns might not ship this locale — silently fall back to English formatting
        }
    }

    if (!cronstrueLocaleCache[code]) {
        try {
            await import(`cronstrue/locales/${code}`);
            cronstrueLocaleCache[code] = code;
        } catch {
            // cronstrue might not ship this locale — silently fall back to English descriptions
        }
    }
}
