import { Alert, Button } from '@app/ui-kit';
import { useTranslation } from 'react-i18next';

/** Shown when a route throws while rendering or loading. */
export function RouteErrorPage() {
  const { t } = useTranslation();
  return (
    <main className="max-w-lg gap-4 p-8 mx-auto flex flex-col">
      <Alert variant="destructive" title={t('routeError.title')}>
        {t('routeError.body')}
      </Alert>
      <Button variant="outline" onClick={() => window.location.reload()}>
        {t('routeError.reload')}
      </Button>
    </main>
  );
}
