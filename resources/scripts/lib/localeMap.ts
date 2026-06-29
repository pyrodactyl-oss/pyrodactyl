import { es } from 'date-fns/locale';
import type { Locale } from 'date-fns';

import i18n from './i18n';

const dateLocales: Record<string, Locale> = { es };

const cronstrueLocales: Record<string, string> = { es: 'es' };

export function getDateLocale(): Locale | undefined {
    return dateLocales[i18n.language];
}

export function getCronstrueLocale(): string | undefined {
    return cronstrueLocales[i18n.language];
}
