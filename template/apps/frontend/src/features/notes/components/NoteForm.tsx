import { isApiError } from '@app/shared';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FormField,
  Input,
  Textarea,
} from '@app/ui-kit';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useErrorMessage } from '@/core/errors/useErrorMessage';
import { useCreateNote } from '../hooks/useNotes';
import { NOTE_LIMITS } from '../limits';

export function NoteForm() {
  const { t } = useTranslation('notes');
  const errorMessage = useErrorMessage();
  const createNote = useCreateNote();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const error = createNote.error;
  const fieldError = (field: string) => (isApiError(error) ? error.fieldError(field) : undefined);
  const formError =
    error && !fieldError('title') && !fieldError('body') ? errorMessage(error) : null;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createNote.mutate(
      { title, body },
      {
        onSuccess: () => {
          setTitle('');
          setBody('');
        },
      },
    );
  };

  return (
    <Card aria-labelledby="new-note-heading">
      <CardHeader>
        <CardTitle id="new-note-heading">{t('form.heading')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
          {formError ? <Alert variant="destructive" title={formError} /> : null}
          <FormField
            label={t('form.titleLabel')}
            hint={t('form.limit', { max: NOTE_LIMITS.title })}
            error={fieldError('title')}
            required
          >
            {(control) => (
              <Input
                {...control}
                value={title}
                maxLength={NOTE_LIMITS.title}
                onChange={(event) => setTitle(event.target.value)}
              />
            )}
          </FormField>
          <FormField label={t('form.bodyLabel')} error={fieldError('body')}>
            {(control) => (
              <Textarea
                {...control}
                value={body}
                maxLength={NOTE_LIMITS.body}
                onChange={(event) => setBody(event.target.value)}
              />
            )}
          </FormField>
          <Button type="submit" loading={createNote.isPending} className="self-start">
            {t('form.submit')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
