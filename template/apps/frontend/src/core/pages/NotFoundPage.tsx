import { Button, EmptyState } from '@app/ui-kit';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <main className="max-w-lg p-8 mx-auto">
      <h1 className="sr-only">{t('notFound.title')}</h1>
      <EmptyState
        title={t('notFound.title')}
        description={t('notFound.body')}
        action={
          <Button asChild>
            <Link to="/notes">{t('notFound.home')}</Link>
          </Button>
        }
      />
    </main>
  );
}
