import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronRight, Folder, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import ConfirmModal from '@/components/Modal/ConfirmModal';
import Modal from '@/components/Modal/Modal';
import LexicalEditor from '@/components/richtext/LexicalEditor';
import * as NoteApi from '@/lib/api/note.api';
import { emptyLexicalStateJson, lexicalToPlainText } from '@/lib/utils/lexicalPlainText';
import type { Note, NoteCategory, SaveState } from '@/lib/types/note';

// Manual save only; no local autosave or local draft merge.

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object') {
    const bodyMessage = (error as { body?: { message?: unknown } }).body?.message;
    if (typeof bodyMessage === 'string') return bodyMessage;

    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }

  return fallback;
}

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatDateLabel(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      timeZone: 'America/Chicago',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function Notes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<NoteCategory[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const currentFolderId = searchParams.get('category')?.trim() || null;
  const selectedNoteId = searchParams.get('note')?.trim() || null;
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [savedTitle, setSavedTitle] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveRequestIdRef = useRef(0);

  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [createNoteOpen, setCreateNoteOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [confirmDeleteFolderOpen, setConfirmDeleteFolderOpen] = useState(false);
  const [confirmDeleteNoteOpen, setConfirmDeleteNoteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState<'folder' | 'note' | null>(null);

  function resetEditorDraft(note?: Note | null) {
    setDraftTitle(note?.title ?? '');
    setDraftContent(note?.content ?? '');
    setSavedTitle(note?.title ?? '');
    setSavedContent(note?.content ?? '');
    setSaveError(null);
    setSaveState('idle');
  }

  function closeCreateFolderModal() {
    setCreateFolderOpen(false);
    setNewFolderName('');
  }

  function closeCreateNoteModal() {
    setCreateNoteOpen(false);
    setNewNoteTitle('');
  }

  function closeDeleteFolderModal() {
    if (deleteBusy) return;
    setConfirmDeleteFolderOpen(false);
  }

  function closeDeleteNoteModal() {
    if (deleteBusy) return;
    setConfirmDeleteNoteOpen(false);
  }

  function setNotesUrl(categoryId: string | null, noteId: string | null, replace = false) {
    const next = new URLSearchParams();
    if (categoryId) next.set('category', categoryId);
    if (noteId) next.set('note', noteId);
    setSearchParams(next, { replace });
  }

  const categoryById = useMemo(() => {
    const map = new Map<string, NoteCategory>();
    for (const c of categories) map.set(c.id, c);
    return map;
  }, [categories]);

  const folderPath = useMemo(() => {
    const path: NoteCategory[] = [];
    const visited = new Set<string>();
    let cursorId = currentFolderId;

    while (cursorId && !visited.has(cursorId)) {
      visited.add(cursorId);
      const folder = categoryById.get(cursorId);
      if (!folder) break;
      path.unshift(folder);
      cursorId = folder.parentId;
    }

    return path;
  }, [categoryById, currentFolderId]);

  const currentFolderName = currentFolderId
    ? categoryById.get(currentFolderId)?.name ?? 'Folder'
    : 'My Notes';
  const parentFolderId =
    folderPath.length > 1 ? folderPath[folderPath.length - 2]!.id : null;
  const bannerError = urlError ?? loadError;

  const visibleFolders = useMemo(() => {
    return categories
      .filter((c) =>
        currentFolderId ? c.parentId === currentFolderId : c.parentId == null,
      )
      .sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return a.createdAt.localeCompare(b.createdAt);
      });
  }, [categories, currentFolderId]);

  const visibleNotes = useMemo(() => {
    return [...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [notes]);

  const selectedNote = useMemo(() => {
    if (!selectedNoteId) return null;
    return visibleNotes.find((note) => note.id === selectedNoteId) ?? null;
  }, [selectedNoteId, visibleNotes]);

  const hasUnsavedChanges =
    !!selectedNote &&
    ((draftTitle.trim() || 'Untitled') !== savedTitle ||
      (draftContent || emptyLexicalStateJson()) !== savedContent);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      NoteApi.getNoteCategories(),
      NoteApi.getNotes({ categoryId: currentFolderId ?? null }),
    ])
      .then(([cats, list]) => {
        if (cancelled) return;
        const nextCategoryById = new Map<string, NoteCategory>();
        for (const category of cats) nextCategoryById.set(category.id, category);

        if (currentFolderId && !nextCategoryById.has(currentFolderId)) {
          setCategories(cats);
          setNotes([]);
          setUrlError('Invalid note link. Returning to Notes.');
          setNotesUrl(null, null, true);
          return;
        }

        setCategories(cats);
        setNotes(list);

        if (selectedNoteId && !list.some((note) => note.id === selectedNoteId)) {
          setUrlError('Invalid note link. Returning to Notes.');
          setNotesUrl(null, null, true);
          return;
        }

        setLoadError(null);
      })
      .catch((error) => {
        if (cancelled) return;
        setLoadError(getErrorMessage(error, 'Failed to load notes'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentFolderId, selectedNoteId]);

  useEffect(() => {
    if (!selectedNote) {
      resetEditorDraft();
      return;
    }

    resetEditorDraft(selectedNote);
  }, [selectedNote?.id]);

  useEffect(() => {
    setConfirmDeleteFolderOpen(false);
  }, [currentFolderId]);

  useEffect(() => {
    setConfirmDeleteNoteOpen(false);
  }, [selectedNote?.id]);

  async function saveNoteManual() {
    if (!selectedNote) return;
    if (!hasUnsavedChanges) return;

    const normalizedTitle = draftTitle.trim() || 'Untitled';
    const normalizedContent = draftContent || emptyLexicalStateJson();
    const requestId = ++saveRequestIdRef.current;

    setSaveState('saving');
    setSaveError(null);
    try {
      const saved = await NoteApi.patchNote(selectedNote.id, {
        title: normalizedTitle,
        content: normalizedContent,
        contentFormat: selectedNote.contentFormat,
      });
      if (requestId !== saveRequestIdRef.current) return;
      setNotes((current) =>
        current.map((note) => (note.id === saved.id ? saved : note)),
      );
      setSavedTitle(saved.title);
      setSavedContent(saved.content);
      setSaveState('saved');

      // Confirm server-side persistence by reloading the list for this folder.
      const latest = await NoteApi.getNotes({ categoryId: currentFolderId ?? null });
      setNotes(latest);
      const serverNote = latest.find((note) => note.id === saved.id);
      if (!serverNote) {
        setSaveState('error');
        setSaveError('Save failed: note missing after refresh.');
        return;
      }
      if (serverNote.content !== normalizedContent || serverNote.title !== normalizedTitle) {
        setSaveState('error');
        setSaveError('Save failed: server did not persist changes.');
        return;
      }
    } catch (error) {
      if (requestId !== saveRequestIdRef.current) return;
      setSaveState('error');
      setSaveError(getErrorMessage(error, 'Failed to save note'));
    }
  }

  async function refreshCategories() {
    const next = await NoteApi.getNoteCategories();
    setCategories(next);
  }

  async function refreshNotes() {
    const next = await NoteApi.getNotes({ categoryId: currentFolderId ?? null });
    setNotes(next);
  }

  async function onCreateFolder() {
    const name = newFolderName.trim();
    if (!name) return;

    try {
      await NoteApi.createNoteCategory({
        name,
        parentId: currentFolderId,
      });
      closeCreateFolderModal();
      await refreshCategories();
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Failed to create folder'));
    }
  }

  async function onCreateNote() {
    const title = newNoteTitle.trim();
    if (!title) return;

    try {
      const created = await NoteApi.createNote({
        title,
        categoryId: currentFolderId,
        content: emptyLexicalStateJson(),
        contentFormat: 'LEXICAL_V1',
      });
      closeCreateNoteModal();
      await refreshNotes();
      setUrlError(null);
      setNotesUrl(currentFolderId, created.id);
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Failed to create note'));
    }
  }

  async function onConfirmDeleteFolder() {
    if (!currentFolderId) return;

    setDeleteBusy('folder');
    setLoadError(null);
    setUrlError(null);

    try {
      const deleted = await NoteApi.deleteNoteCategory(currentFolderId);
      setConfirmDeleteFolderOpen(false);
      setNotesUrl(deleted.parentId, null);
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Failed to delete folder'));
    } finally {
      setDeleteBusy(null);
    }
  }

  async function onConfirmDeleteNote() {
    if (!selectedNote) return;

    setDeleteBusy('note');
    setLoadError(null);
    setUrlError(null);

    try {
      await NoteApi.deleteNote(selectedNote.id);
      setNotes((current) => current.filter((note) => note.id !== selectedNote.id));
      resetEditorDraft();
      setConfirmDeleteNoteOpen(false);
      setNotesUrl(currentFolderId, null);
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Failed to delete note'));
    } finally {
      setDeleteBusy(null);
    }
  }

  function getListNoteTitle(note: Note) {
    if (note.id === selectedNoteId && draftTitle.trim()) return draftTitle.trim();
    return note.title;
  }

  function getListNotePreview(note: Note) {
    const content = note.id === selectedNoteId ? draftContent : note.content;
    return lexicalToPlainText(content).slice(0, 120);
  }

  return (
    <div className="h-full bg-[var(--bg)]">
      <div className="grid h-full grid-cols-1 lg:grid-cols-[360px_1fr]">
        <section className="flex h-full min-h-0 flex-col border-b border-[var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_70%,var(--bg))] lg:border-b-0 lg:border-r">
          <div className="border-b border-[var(--border)] px-6 py-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                {currentFolderId ? (
                  <button
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg hover:bg-[color:var(--panel2)]"
                    type="button"
                    title="Back"
                    aria-label="Back"
                    onClick={() => {
                      setConfirmDeleteFolderOpen(false);
                      setConfirmDeleteNoteOpen(false);
                      setUrlError(null);
                      setNotesUrl(parentFolderId, null);
                    }}>
                    <ArrowLeft size={16} aria-hidden="true" />
                  </button>
                ) : null}
                <span>Workspace</span>
              </div>
              <div className="mt-2 flex items-start justify-between gap-3">
                <h1 className="min-w-0 truncate text-[30px] font-semibold tracking-[-0.03em]">
                  {currentFolderName}
                </h1>
                {currentFolderId ? (
                  <button
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[color:rgba(255,84,84,0.35)] bg-[color:rgba(255,84,84,0.14)] text-[color:rgba(255,84,84,0.95)] hover:bg-[color:rgba(255,84,84,0.18)] disabled:cursor-not-allowed disabled:opacity-60"
                    type="button"
                    aria-label="Delete current folder"
                    title="Delete current folder"
                    disabled={deleteBusy !== null}
                    onClick={() => setConfirmDeleteFolderOpen(true)}>
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                ) : null}
              </div>
              <div className="mt-1 text-sm text-[var(--muted)]">
                {loading
                  ? 'Loading notes...'
                  : `${visibleFolders.length} folders and ${visibleNotes.length} notes`}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-[var(--border)] bg-[color:var(--panel)] px-4 py-4 text-left hover:bg-[color:var(--panel2)]"
                type="button"
                onClick={() => {
                  setConfirmDeleteFolderOpen(false);
                  setConfirmDeleteNoteOpen(false);
                  setCreateFolderOpen(true);
                }}>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--panel2)]">
                  <Folder size={16} aria-hidden="true" />
                </div>
                <div className="text-sm font-medium">New folder</div>
              </button>

              <button
                className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-[var(--border)] bg-[color:var(--panel)] px-4 py-4 text-left hover:bg-[color:var(--panel2)]"
                type="button"
                onClick={() => {
                  setConfirmDeleteFolderOpen(false);
                  setConfirmDeleteNoteOpen(false);
                  setCreateNoteOpen(true);
                }}>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--panel2)]">
                  <Plus size={16} aria-hidden="true" />
                </div>
                <div className="text-sm font-medium">Add Note</div>
              </button>
            </div>
          </div>

          {bannerError ? (
            <div className="border-b border-[var(--border)] px-6 py-3 text-sm text-red-400">
              {bannerError}
            </div>
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
            {loading ? (
              <div className="px-3 py-4 text-sm text-[var(--muted)]">Loading...</div>
            ) : (
              <div className="space-y-1">
                {visibleFolders.map((folder) => (
                  <button
                    key={folder.id}
                    type="button"
                    className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left hover:bg-[color:var(--panel)]"
                    onClick={() => {
                      setConfirmDeleteFolderOpen(false);
                      setConfirmDeleteNoteOpen(false);
                      setUrlError(null);
                      setNotesUrl(folder.id, null);
                    }}>
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--panel)]">
                        <Folder size={17} aria-hidden="true" className="text-[var(--muted)]" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {folder.name}
                        </div>
                        <div className="mt-0.5 text-xs text-[var(--muted)]">
                          Folder
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={16} aria-hidden="true" className="text-[var(--muted)]" />
                  </button>
                ))}

                {visibleNotes.map((note) => {
                  const active = note.id === selectedNoteId;
                  const preview = getListNotePreview(note);
                  return (
                    <button
                      key={note.id}
                      type="button"
                      className={[
                        'w-full rounded-2xl border px-4 py-3 text-left transition',
                        active
                          ? 'border-[color:color-mix(in_srgb,var(--text)_10%,var(--border))] bg-[color:var(--panel)] shadow-[0_10px_30px_rgba(0,0,0,0.08)]'
                          : 'border-transparent hover:border-[var(--border)] hover:bg-[color:var(--panel)]',
                      ].join(' ')}
                      onClick={() => {
                        setConfirmDeleteFolderOpen(false);
                        setConfirmDeleteNoteOpen(false);
                        setUrlError(null);
                        setNotesUrl(currentFolderId, note.id);
                      }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
                            {formatDateLabel(note.updatedAt)}
                          </div>
                          <div className="mt-2 truncate text-[15px] font-semibold leading-5">
                            {getListNoteTitle(note)}
                          </div>
                          <div className="mt-2 truncate text-sm text-[var(--muted)]">
                            {preview || 'Empty note'}
                          </div>
                        </div>
                        <span
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--muted)]"
                          aria-hidden="true">
                          <MoreHorizontal size={16} aria-hidden="true" />
                        </span>
                      </div>
                    </button>
                  );
                })}

                {visibleFolders.length === 0 && visibleNotes.length === 0 ? (
                  <div className="px-3 py-8 text-center text-sm text-[var(--muted)]">
                    This level is empty. Create a folder or a note to get started.
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </section>

        <section className="min-h-0 bg-[color:color-mix(in_srgb,var(--bg)_88%,white_12%)]">
          {selectedNote ? (
            <div className="flex h-full min-h-0 flex-col">
              <div className="px-8 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
                      <span>My Notes</span>
                      {folderPath.map((folder) => (
                        <span key={folder.id} className="inline-flex items-center gap-2">
                          <ChevronRight size={14} aria-hidden="true" />
                          <span>{folder.name}</span>
                        </span>
                      ))}
                    </div>
                    <input
                      className="mt-4 w-full border-0 bg-transparent p-0 text-[44px] font-semibold leading-tight tracking-[-0.04em] text-[var(--text)] placeholder:text-[color:color-mix(in_srgb,var(--muted)_90%,transparent)] focus:outline-none"
                      value={draftTitle}
                      placeholder="Untitled"
                      onChange={(e) => setDraftTitle(e.target.value)}
                    />
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[var(--muted)]">
                      <span>Last modified {formatDateTime(selectedNote.updatedAt)}</span>
                      <span>
                        {hasUnsavedChanges ? 'Unsaved changes' : 'All changes saved'}
                      </span>
                    </div>
                    {saveError ? (
                      <div className="mt-2 text-sm text-red-400">{saveError}</div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-[color:var(--text)] px-3 text-sm font-medium text-[var(--bg)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      type="button"
                      onClick={saveNoteManual}
                      disabled={!hasUnsavedChanges || saveState === 'saving'}>
                      {saveState === 'saving' ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:rgba(255,84,84,0.35)] bg-[color:rgba(255,84,84,0.14)] text-[color:rgba(255,84,84,0.95)] hover:bg-[color:rgba(255,84,84,0.18)] disabled:cursor-not-allowed disabled:opacity-60"
                      type="button"
                      aria-label="Delete note"
                      title="Delete note"
                      disabled={deleteBusy !== null}
                      onClick={() => setConfirmDeleteNoteOpen(true)}>
                      <Trash2 size={18} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-8 py-3">
                <div className="h-full">
                  <LexicalEditor
                    key={selectedNote.id}
                    value={draftContent}
                    onChange={(json) => setDraftContent(json)}
                    placeholder="Start writing..."
                    disabled={false}
                    showToolbar={true}
                    className="lx-editor--plain"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full" />
          )}
        </section>
      </div>

      <Modal
        open={createFolderOpen}
        title="New Folder"
        onClose={closeCreateFolderModal}>
        <div className="space-y-3">
          <div className="text-sm text-[var(--muted)]">
            Create a folder{currentFolderId ? ' inside this folder' : ''}.
          </div>
          <input
            className="h-11 w-full rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-3 text-[color:var(--text)] placeholder:text-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            value={newFolderName}
            placeholder="Folder name"
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onCreateFolder();
            }}
          />
          <div className="flex justify-end gap-2">
            <button
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-4 text-sm font-semibold hover:bg-[color:var(--panel)]"
              type="button"
              onClick={closeCreateFolderModal}>
              Cancel
            </button>
            <button
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[color:var(--panel2)] px-4 text-sm font-semibold hover:bg-[color:var(--panel)] disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              disabled={!newFolderName.trim()}
              onClick={onCreateFolder}>
              Create
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={confirmDeleteFolderOpen}
        title="Delete folder?"
        message={`Delete "${currentFolderName}" and everything inside it? This removes all nested folders and notes.`}
        confirmText={deleteBusy === 'folder' ? 'Deleting...' : 'Delete folder'}
        cancelText="Cancel"
        danger={true}
        disabled={deleteBusy !== null}
        onConfirm={onConfirmDeleteFolder}
        onCancel={closeDeleteFolderModal}
      />

      <ConfirmModal
        open={confirmDeleteNoteOpen}
        title="Delete note?"
        message={
          selectedNote
            ? `Delete "${selectedNote.title}" permanently?`
            : 'Delete this note permanently?'
        }
        confirmText={deleteBusy === 'note' ? 'Deleting...' : 'Delete note'}
        cancelText="Cancel"
        danger={true}
        disabled={deleteBusy !== null}
        onConfirm={onConfirmDeleteNote}
        onCancel={closeDeleteNoteModal}
      />

      <Modal
        open={createNoteOpen}
        title="New Note"
        onClose={closeCreateNoteModal}>
        <div className="space-y-3">
          <div className="text-sm text-[var(--muted)]">
            Create a note{currentFolderId ? ' in this folder' : ' (uncategorized)'}.
          </div>
          <input
            className="h-11 w-full rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-3 text-[color:var(--text)] placeholder:text-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            value={newNoteTitle}
            placeholder="Note title"
            onChange={(e) => setNewNoteTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onCreateNote();
            }}
          />
          <div className="flex justify-end gap-2">
            <button
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[color:var(--panel2)] px-4 text-sm font-semibold hover:bg-[color:var(--panel)]"
              type="button"
              onClick={closeCreateNoteModal}>
              Cancel
            </button>
            <button
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[color:var(--panel2)] px-4 text-sm font-semibold hover:bg-[color:var(--panel)] disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              disabled={!newNoteTitle.trim()}
              onClick={onCreateNote}>
              Create
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
