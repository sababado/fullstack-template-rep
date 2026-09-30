import { isApiError } from '@app/shared';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import errors from '../i18n/locales/en/errors';

type KnownCode = keyof typeof errors.codes;

function isKnownCode(code: string): code is KnownCode {
  return code in errors.codes;
}

/**
 * A translated, user-safe message for any error.
 * Known API codes use locales/<lang>/errors.ts; other API errors show the
 * backend's safe message; anything else gets a generic message.
 */
export function useErrorMessage(): (error: unknown) => string {
  const { t } = useTranslation('errors');
  return useCallback(
    (error: unknown) => {
      if (isApiError(error)) {
        return isKnownCode(error.code) ? t(`codes.${error.code}`) : error.message;
      }
      return t('unexpected');
    },
    [t],
  );
}
