import { Alert, Button } from '@app/ui-kit';
import { useTranslation } from 'react-i18next';

/** Shown when a route throws while rendering or loading. */
export function RouteErrorPage() {
  const { t } = useTranslation();
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 p-8">
      <Alert variant="destructive" title={t('routeError.title')}>
        {t('routeError.body')}
      </Alert>
      <Button variant="outline" onClick={() => window.location.reload()}>
        {t('routeError.reload')}
      </Button>
    </main>
  );
}
