import en from './en';
import af from './af';
import zu from './zu';
import xh from './xh';

export type SupportedLanguage = 'en' | 'af' | 'zu' | 'xh';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇿🇦' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', flag: '🇿🇦' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', flag: '🇿🇦' },
  { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa', flag: '🇿🇦' },
];

export const translations: Record<SupportedLanguage, typeof en> = {
  en,
  af,
  zu,
  xh,
};

export { en, af, zu, xh };
export type { TranslationKeys } from './en';
