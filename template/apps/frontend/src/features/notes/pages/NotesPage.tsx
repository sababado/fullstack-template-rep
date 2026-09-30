import { useTranslation } from 'react-i18next';
import { NoteForm } from '../components/NoteForm';
import { NoteList } from '../components/NoteList';

export function NotesPage() {
  const { t } = useTranslation('notes');
  return (
    <div className="gap-8 flex flex-col">
      <header className="gap-1 flex flex-col">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </header>
      <div className="gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] grid items-start">
        <NoteForm />
        <NoteList />
      </div>
    </div>
  );
}
