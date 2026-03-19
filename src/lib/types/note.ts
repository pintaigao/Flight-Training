export type NoteCategory = {
  id: string;
  userId: string;
  parentId: string | null;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type NoteContentFormat = 'LEXICAL_V1';

export type Note = {
  id: string;
  userId: string;
  categoryId: string | null;
  title: string;
  content: string;
  contentFormat: NoteContentFormat;
  createdAt: string;
  updatedAt: string;
};

export type DeleteNoteCategoryResult = {
  deletedCategoryIds: string[];
  deletedNoteIds: string[];
  parentId: string | null;
};

export type DeleteNoteResult = {
  id: string;
  categoryId: string | null;
};

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';
