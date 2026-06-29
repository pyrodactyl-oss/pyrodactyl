import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export const SUPPORTED_LANGUAGES = ['en', 'es'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export let LANGUAGE_NAMES: Record<string, string> = {
    en: 'English',
    es: 'Español',
};

export let supportedLanguages: string[] = [...SUPPORTED_LANGUAGES];

export async function fetchSupportedLanguages(): Promise<void> {
    try {
        const res = await fetch('/locales/languages.json', { cache: 'no-cache' });
        if (!res.ok) {
            return;
        }
        const data: Record<string, string> = await res.json();
        supportedLanguages = Object.keys(data);
        LANGUAGE_NAMES = data;
        i18n.options.supportedLngs = supportedLanguages;
    } catch {
        // Fall back to hardcoded defaults
    }
}

export const NAMESPACES = ['strings', 'auth', 'dashboard', 'server', 'activity'];

async function fetchNamespace(lng: string, ns: string) {
    try {
        const url = `/locales/locale.json?locale=${lng}&namespace=${ns}`;
        const res = await fetch(url);
        if (!res.ok) {
            return;
        }
        const data = await res.json();
        const translations = data[lng]?.[ns] ?? {};
        i18n.addResourceBundle(lng, ns, translations, true, true);
    } catch {
        // Silently fail — translations will fall back to keys or default language
    }
}

i18n.use(initReactI18next).init({
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES,
    ns: NAMESPACES,
    defaultNS: 'strings',
    interpolation: {
        escapeValue: false,
    },
    react: {
        useSuspense: false,
    },
});

export async function loadTranslations(lng: string) {
    await Promise.all(NAMESPACES.map((ns) => fetchNamespace(lng, ns)));
}

export default i18n;
