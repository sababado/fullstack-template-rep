import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notesApi, type NoteCreate } from '../api/notesApi';

export const notesKeys = {
  all: ['notes'] as const,
  list: () => [...notesKeys.all, 'list'] as const,
};

export function useNotes() {
  return useQuery({ queryKey: notesKeys.list(), queryFn: notesApi.list });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: NoteCreate) => notesApi.create(body),
    // The form shows this mutation's errors next to the fields.
    meta: { handlesErrors: true },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notesKeys.all }),
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => notesApi.remove(noteId),
    meta: { handlesErrors: true },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notesKeys.all }),
  });
}
