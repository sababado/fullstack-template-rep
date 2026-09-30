import { api, unwrap, type Schemas } from '@/core/api/client';

export type Note = Schemas['NoteRead'];
export type NoteCreate = Schemas['NoteCreate'];

export const notesApi = {
  list: async (): Promise<Note[]> =>
    (await unwrap(api.GET('/notes', { params: { query: { limit: 100 } } }))).items,
  create: (body: NoteCreate): Promise<Note> => unwrap(api.POST('/notes', { body })),
  remove: (noteId: string): Promise<void> =>
    unwrap(api.DELETE('/notes/{note_id}', { params: { path: { note_id: noteId } } })),
};
