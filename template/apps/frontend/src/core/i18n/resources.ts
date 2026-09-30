import common from './locales/en/common';
import errors from './locales/en/errors';
import notes from './locales/en/notes';

// To add a language, copy locales/en to locales/<code>, translate, and add it here.
export const resources = {
  en: { common, errors, notes },
} as const;

export const defaultNS = 'common';
export const supportedLanguages = Object.keys(resources);
