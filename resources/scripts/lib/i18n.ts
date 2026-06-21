import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export const SUPPORTED_LANGUAGES = ['en', 'es'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
    en: 'English',
    es: 'Español',
};

export const NAMESPACES = ['strings', 'auth', 'dashboard', 'server', 'activity'];

async function fetchNamespace(lng: string, ns: string) {
    const url = `/locales/locale.json?locale=${lng}&namespace=${ns}`;
    const res = await fetch(url);
    const data = await res.json();
    const translations = data[lng]?.[ns] ?? {};
    i18n.addResourceBundle(lng, ns, translations, true, true);
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
