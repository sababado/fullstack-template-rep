import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ICU from 'i18next-icu';
import { initReactI18next } from 'react-i18next';
import { defaultNS, resources, supportedLanguages } from '../i18n/resources';

void i18n
  .use(ICU)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    defaultNS,
    fallbackLng: 'en',
    supportedLngs: supportedLanguages,
    load: 'languageOnly',
    initAsync: false,
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
  });

// Keep <html lang> in step with the active language for screen readers.
i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language;
});
document.documentElement.lang = i18n.resolvedLanguage ?? 'en';

export default i18n;
