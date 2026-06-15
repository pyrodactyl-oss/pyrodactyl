import { LanguageDescription } from '@codemirror/language';
import { languages } from '@codemirror/language-data';

import { skriptLanguageDescription } from './skript';

export const availableLanguages: LanguageDescription[] = [...languages, skriptLanguageDescription];

export function findLanguageByFilename(filename: string): LanguageDescription | undefined {
    const language = LanguageDescription.matchFilename(availableLanguages, filename);
    return language === null ? undefined : language;
}
