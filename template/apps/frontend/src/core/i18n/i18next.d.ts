import 'i18next';
import type { defaultNS, resources } from './resources';

// Type-checks every t('key') call against the English resources.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    resources: (typeof resources)['en'];
  }
}
