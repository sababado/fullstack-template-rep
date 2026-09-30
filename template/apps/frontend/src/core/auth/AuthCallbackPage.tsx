import { Spinner } from '@app/ui-kit';
import { useTranslation } from 'react-i18next';

/** The OIDC redirect target. The auth provider completes sign-in, then navigates away. */
export function AuthCallbackPage() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Spinner label={t('auth.signingIn')} className="size-6" />
    </div>
  );
}
