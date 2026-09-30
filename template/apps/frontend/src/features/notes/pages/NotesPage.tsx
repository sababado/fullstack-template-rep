import { useTranslation } from 'react-i18next';
import { NoteForm } from '../components/NoteForm';
import { NoteList } from '../components/NoteList';

export function NotesPage() {
  const { t } = useTranslation('notes');
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </header>
      <div className="grid items-start gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <NoteForm />
        <NoteList />
      </div>
    </div>
  );
}
