import { http } from './client';
import type { DeleteNoteCategoryResult, DeleteNoteResult, Note, NoteCategory, NoteContentFormat } from '@/lib/types/note';

export function getNoteCategories() {
  return http.get<NoteCategory[]>('/note/categories').then((res) => res.data);
}

export function createNoteCategory(payload: {
  name: string;
  parentId?: string | null;
  sortOrder?: number;
}) {
  return http
    .post<NoteCategory>('/note/categories', payload)
    .then((res) => res.data);
}

export function deleteNoteCategory(id: string) {
  return http
    .delete<DeleteNoteCategoryResult>(`/note/categories/${encodeURIComponent(id)}`)
    .then((res) => res.data);
}

export function deleteNote(id: string) {
  return http
    .delete<DeleteNoteResult>(`/note/${encodeURIComponent(id)}`)
    .then((res) => res.data);
}

export function getNotes(opts?: { categoryId?: string | null }) {
  const params = new URLSearchParams();
  if (opts && 'categoryId' in opts) {
    if (opts.categoryId === null) params.set('categoryId', 'null');
    else if (typeof opts.categoryId === 'string' && opts.categoryId.trim())
      params.set('categoryId', opts.categoryId.trim());
  }
  const qs = params.toString();
  return http.get<Note[]>(`/note${qs ? `?${qs}` : ''}`).then((res) => res.data);
}

export function createNote(payload: {
  categoryId?: string | null;
  title: string;
  content: string;
  contentFormat?: NoteContentFormat;
}) {
  return http.post<Note>('/note', payload).then((res) => res.data);
}

export function patchNote(
  id: string,
  payload: {
    categoryId?: string | null;
    title?: string;
    content?: string;
    contentFormat?: NoteContentFormat;
  },
) {
  return http
    .patch<Note>(`/note/${encodeURIComponent(id)}`, payload)
    .then((res) => res.data);
}
