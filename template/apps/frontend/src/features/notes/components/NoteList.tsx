import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Spinner,
} from '@app/ui-kit';
import { StickyNote, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useErrorMessage } from '@/core/errors/useErrorMessage';
import { useDeleteNote, useNotes } from '../hooks/useNotes';

export function NoteList() {
  const { t } = useTranslation('notes');
  const errorMessage = useErrorMessage();
  const notes = useNotes();
  const deleteNote = useDeleteNote();

  if (notes.isPending) {
    return (
      <div className="flex justify-center py-12">
        <Spinner label={t('loading')} className="size-6" />
      </div>
    );
  }

  if (notes.isError) {
    return (
      <div className="flex flex-col items-start gap-3">
        <Alert variant="destructive" title={t('loadFailed')}>
          {errorMessage(notes.error)}
        </Alert>
        <Button variant="outline" onClick={() => void notes.refetch()}>
          {t('retry')}
        </Button>
      </div>
    );
  }

  if (notes.data.length === 0) {
    return (
      <EmptyState icon={StickyNote} title={t('empty.title')} description={t('empty.description')} />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">{t('count', { count: notes.data.length })}</p>
      {deleteNote.isError ? (
        <Alert variant="destructive" title={errorMessage(deleteNote.error)} />
      ) : null}
      <ul className="flex flex-col gap-3">
        {notes.data.map((note) => (
          <li key={note.id}>
            <Card aria-labelledby={`note-${note.id}`}>
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <CardTitle id={`note-${note.id}`}>{note.title}</CardTitle>
                  <CardDescription>
                    {t('item.updated', { date: new Date(note.updated_at) })}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t('item.delete', { title: note.title })}
                  loading={deleteNote.isPending && deleteNote.variables === note.id}
                  onClick={() => deleteNote.mutate(note.id)}
                >
                  <Trash2 aria-hidden />
                </Button>
              </CardHeader>
              {note.body ? (
                <CardContent className="whitespace-pre-wrap">{note.body}</CardContent>
              ) : null}
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
