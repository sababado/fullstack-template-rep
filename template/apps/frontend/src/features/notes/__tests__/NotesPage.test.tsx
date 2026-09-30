import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { json, mockApi } from '@/core/test/mockApi';
import { renderApp } from '@/core/test/renderApp';
import type { Note } from '../api/notesApi';

function note(overrides: Partial<Note> = {}): Note {
  return {
    id: '0199a1b2-0000-7000-8000-000000000001',
    title: 'Groceries',
    body: 'Milk',
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
    ...overrides,
  };
}

describe('NotesPage', () => {
  it('lists notes', async () => {
    mockApi({
      'GET /notes': () =>
        json(200, { items: [note(), note({ id: 'n2', title: 'Errands', body: '' })] }),
    });

    renderApp('/notes');

    expect(await screen.findByText('2 notes')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Groceries' })).toHaveTextContent('Milk');
    expect(screen.getByRole('region', { name: 'Errands' })).toBeInTheDocument();
  });

  it('shows an empty state', async () => {
    mockApi({ 'GET /notes': () => json(200, { items: [] }) });

    renderApp('/notes');

    expect(await screen.findByText('No notes yet')).toBeInTheDocument();
  });

  it('creates a note and refreshes the list', async () => {
    let items: Note[] = [];
    const { requests } = mockApi({
      'GET /notes': () => json(200, { items }),
      'POST /notes': async (request) => {
        const body = (await request.json()) as { title: string; body: string };
        items = [note({ title: body.title, body: body.body })];
        return json(201, items[0]);
      },
    });
    renderApp('/notes');
    await screen.findByText('No notes yet');

    await userEvent.type(screen.getByRole('textbox', { name: /Title/ }), 'Groceries');
    await userEvent.type(screen.getByRole('textbox', { name: 'Details' }), 'Milk');
    await userEvent.click(screen.getByRole('button', { name: 'Add note' }));

    expect(await screen.findByRole('region', { name: 'Groceries' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Title/ })).toHaveValue('');
    const post = requests.find((request) => request.method === 'POST');
    expect(await post?.json()).toEqual({ title: 'Groceries', body: 'Milk' });
  });

  it('shows field errors from the API next to the field', async () => {
    mockApi({
      'GET /notes': () => json(200, { items: [] }),
      'POST /notes': () =>
        json(422, {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Some fields need attention.',
            fields: [
              {
                field: 'title',
                message: 'Enter at least one visible character.',
                type: 'value_error',
              },
            ],
          },
        }),
    });
    renderApp('/notes');
    await screen.findByText('No notes yet');

    await userEvent.click(screen.getByRole('button', { name: 'Add note' }));

    const title = screen.getByRole('textbox', { name: /Title/ });
    await waitFor(() => expect(title).toHaveAttribute('aria-invalid', 'true'));
    expect(title).toHaveAccessibleDescription(/Enter at least one visible character\./);
  });

  it('shows a load failure with a retry', async () => {
    let fail = true;
    mockApi({
      'GET /notes': () =>
        fail
          ? json(503, { error: { code: 'INTERNAL_ERROR', message: 'Down.' } })
          : json(200, { items: [] }),
    });
    renderApp('/notes');

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent("Couldn't load your notes");
    fail = false;
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('No notes yet')).toBeInTheDocument();
  });

  it('deletes a note', async () => {
    let items = [note()];
    mockApi({
      'GET /notes': () => json(200, { items }),
      'DELETE /notes/:id': () => {
        items = [];
        return new Response(null, { status: 204 });
      },
    });
    renderApp('/notes');
    const card = await screen.findByRole('region', { name: 'Groceries' });

    await userEvent.click(within(card).getByRole('button', { name: 'Delete “Groceries”' }));

    expect(await screen.findByText('No notes yet')).toBeInTheDocument();
  });

  it('reports a failed delete', async () => {
    mockApi({
      'GET /notes': () => json(200, { items: [note()] }),
      'DELETE /notes/:id': () =>
        json(404, { error: { code: 'NOTE_NOT_FOUND', message: 'Note not found.' } }),
    });
    renderApp('/notes');
    const card = await screen.findByRole('region', { name: 'Groceries' });

    await userEvent.click(within(card).getByRole('button', { name: /Delete/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('That note no longer exists.');
  });
});
