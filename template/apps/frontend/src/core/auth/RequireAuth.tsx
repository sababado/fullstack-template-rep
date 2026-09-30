import { Alert, Button, Spinner } from '@app/ui-kit';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router';
import { useAuth } from './authContext';

/** Layout route: renders its children only for a signed-in user. */
export function RequireAuth() {
  const { t } = useTranslation();
  const auth = useAuth();

  useEffect(() => {
    if (auth.status === 'anonymous') void auth.signIn();
  }, [auth]);

  if (auth.status === 'authenticated') return <Outlet />;

  if (auth.status === 'error') {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4 p-8">
        <Alert variant="destructive" title={t('auth.failed')}>
          {auth.error?.message}
        </Alert>
        <Button onClick={() => void auth.signIn()}>{t('auth.retry')}</Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Spinner label={t('auth.signingIn')} className="size-6" />
    </div>
  );
}
