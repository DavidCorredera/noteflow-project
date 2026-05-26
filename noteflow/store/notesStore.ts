import { create } from 'zustand';
import { Note, ChecklistNote, IdeaNote, ChecklistItem } from '../types';
import {
  getNotes,
  createNote,
  deleteNoteApi,
  addChecklistItemApi,
  toggleChecklistItemApi,
  deleteChecklistItemApi,
  updateChecklistItemApi,
  updateNoteApi,
} from '../lib/api';

type NewNoteInput = Pick<Note, 'title' | 'content'>;
type NewChecklistInput = Pick<ChecklistNote, 'title'> & { items?: string[] };
type NewIdeaInput = Pick<IdeaNote, 'title' | 'tags'> & Partial<Pick<IdeaNote, 'color'>>;

const normalizeChecklistItem = (item: any): ChecklistItem => ({
  ...item,
  isCompleted: item.isCompleted ?? item.is_completed ?? false,
});

const normalizeNote = (note: any) => ({
  ...note,
  createdAt: new Date(note.created_at ?? note.createdAt),
  updatedAt: new Date(note.updated_at ?? note.updatedAt),
  items: (note.items ?? []).map((item: any) => normalizeChecklistItem(item)),
  tags: note.tags ?? [],
});

interface NotesStore {
  notes: Note[];
  checklists: ChecklistNote[];
  ideas: IdeaNote[];
  isLoading: boolean;
  error: string | null;

  fetchNotes: () => Promise<void>;
  addNote: (note: NewNoteInput) => Promise<void>;
  addChecklist: (note: NewChecklistInput) => Promise<void>;
  addIdea: (note: NewIdeaInput) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  toggleChecklistItem: (checklistId: string, itemId: string, currentStatus: boolean) => Promise<void>;
  addChecklistItem: (checklistId: string, text: string) => Promise<void>;
  deleteChecklistItem: (checklistId: string, itemId: string) => Promise<void>;
  updateChecklistItem: (checklistId: string, itemId: string, text: string) => Promise<void>;
  updateNote: (id: string, data: Partial<Note>) => Promise<void>;
  updateIdea: (id: string, data: Partial<IdeaNote>) => Promise<void>;
  updateChecklist: (id: string, data: Partial<ChecklistNote>) => Promise<void>;
}

export const useNotesStore = create<NotesStore>((set, get) => ({
  notes: [],
  checklists: [],
  ideas: [],
  isLoading: false,
  error: null,

  fetchNotes: async () => {
    set({ isLoading: true, error: null });
    try {
      const allNotes = await getNotes();
      const formattedNotes = allNotes.map((n: any) => normalizeNote(n));

      set({
        notes: formattedNotes.filter((n: any) => n.type === 'note'),
        checklists: formattedNotes.filter((n: any) => n.type === 'checklist'),
        ideas: formattedNotes.filter((n: any) => n.type === 'idea'),
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  addNote: async (note) => {
    try {
      const res = await createNote({ ...note, type: 'note' });
      const newNote = normalizeNote(res);
      set((state) => ({ notes: [newNote, ...state.notes] }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  addChecklist: async (note) => {
    try {
      const res = await createNote({ title: note.title, type: 'checklist' });
      let newChecklist = normalizeNote(res);
      const itemTexts = (note.items ?? []).map((item) => item.trim()).filter(Boolean);
      let partialSaveError: string | null = null;

      if (itemTexts.length > 0) {
        const createdItems: ChecklistItem[] = [];

        for (const text of itemTexts) {
          try {
            const createdItem = await addChecklistItemApi(newChecklist.id, text);
            createdItems.push(normalizeChecklistItem(createdItem));
          } catch (error) {
            partialSaveError = 'La tarea se creo, pero no se pudieron guardar todas sus subtareas.';
            break;
          }
        }

        newChecklist = { ...newChecklist, items: createdItems };
      }

      set((state) => ({ checklists: [newChecklist, ...state.checklists], error: partialSaveError }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  addIdea: async (note) => {
    try {
      const res = await createNote({ ...note, type: 'idea' });
      const newIdea = normalizeNote(res);

      set((state) => ({ ideas: [newIdea, ...state.ideas], error: null }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteNote: async (id) => {
    try {
      await deleteNoteApi(id);
      set((state) => ({
        notes: state.notes.filter((n) => n.id !== id),
        checklists: state.checklists.filter((c) => c.id !== id),
        ideas: state.ideas.filter((i) => i.id !== id),
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  addChecklistItem: async (checklistId, text) => {
    try {
      const newItem = await addChecklistItemApi(checklistId, text);
      set((state) => ({
        checklists: state.checklists.map((c) =>
          c.id === checklistId
            ? { ...c, items: [...(c.items || []), normalizeChecklistItem(newItem)] }
            : c
        ),
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteChecklistItem: async (checklistId, itemId) => {
    try {
      await deleteChecklistItemApi(itemId);
      set((state) => ({
        checklists: state.checklists.map((c) =>
          c.id === checklistId
            ? { ...c, items: (c.items || []).filter((i) => i.id !== itemId) }
            : c
        ),
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updateChecklistItem: async (checklistId, itemId, text) => {
    try {
      await updateChecklistItemApi(itemId, text);
      set((state) => ({
        checklists: state.checklists.map((c) =>
          c.id === checklistId
            ? { ...c, items: (c.items || []).map((i) => (i.id === itemId ? { ...i, text } : i)) }
            : c
        ),
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updateNote: async (id, data) => {
    try {
      const updated = normalizeNote(await updateNoteApi(id, data));
      set((state) => ({
        notes: state.notes.map((n) => (n.id === id ? { ...n, ...updated, ...data } : n)),
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updateIdea: async (id, data) => {
    try {
      const updated = normalizeNote(await updateNoteApi(id, data));
      set((state) => ({
        ideas: state.ideas.map((i) => (i.id === id ? { ...i, ...updated, ...data } : i)),
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updateChecklist: async (id, data) => {
    try {
      const updated = normalizeNote(await updateNoteApi(id, data));
      set((state) => ({
        checklists: state.checklists.map((c) => (c.id === id ? { ...c, ...updated, ...data } : c)),
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  toggleChecklistItem: async (checklistId, itemId, currentStatus) => {
    set((state) => ({
      checklists: state.checklists.map((c) =>
        c.id === checklistId
          ? {
              ...c,
              items: (c.items || []).map((i) =>
                i.id === itemId ? { ...i, isCompleted: !currentStatus } : i
              ),
            }
          : c
      ),
    }));

    try {
      await toggleChecklistItemApi(itemId, !currentStatus);
    } catch (error: any) {
      get().fetchNotes();
      set({ error: error.message });
    }
  },
}));
