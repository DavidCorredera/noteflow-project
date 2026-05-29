import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ItemPriority, Note, ChecklistNote, IdeaNote, ChecklistItem } from '../types';
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

const PRIORITY_STORAGE_KEY = 'noteflow_priorities';

async function loadPriorities(): Promise<Record<string, ItemPriority>> {
  try {
    const raw = await AsyncStorage.getItem(PRIORITY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function savePriorities(priorities: Record<string, ItemPriority>) {
  try {
    await AsyncStorage.setItem(PRIORITY_STORAGE_KEY, JSON.stringify(priorities));
  } catch {}
}

type NewNoteInput = Pick<Note, 'title' | 'content'> & { reminderDate?: string; latitude?: number; longitude?: number; folderId?: string };
type NewChecklistInput = Pick<ChecklistNote, 'title'> & { items?: { text: string; priority?: ItemPriority }[]; reminderDate?: string; latitude?: number; longitude?: number; folderId?: string };
type NewIdeaInput = Pick<IdeaNote, 'title' | 'tags'> & Partial<Pick<IdeaNote, 'color' | 'content' | 'pinned'>> & { reminderDate?: string; latitude?: number; longitude?: number; folderId?: string };

const normalizeChecklistItem = (item: any): ChecklistItem => ({
  ...item,
  isCompleted: item.isCompleted ?? item.is_completed ?? false,
  priority: item.priority ?? 'none',
  dueDate: item.dueDate ?? item.due_date ?? undefined,
});

const normalizeNote = (note: any) => ({
  ...note,
  folderId: note.folder_id ?? note.folderId ?? undefined,
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
  archiveNote: (id: string) => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
  toggleChecklistItem: (checklistId: string, itemId: string, currentStatus: boolean) => void;
  addChecklistItem: (checklistId: string, text: string, priority?: ItemPriority) => Promise<void>;
  deleteChecklistItem: (checklistId: string, itemId: string) => Promise<void>;
  updateChecklistItem: (checklistId: string, itemId: string, text: string) => Promise<void>;
  updateItemPriority: (checklistId: string, itemId: string, priority: ItemPriority) => void;
  updateNote: (id: string, data: Partial<Note>) => Promise<void>;
  updateIdea: (id: string, data: Partial<IdeaNote>) => Promise<void>;
  updateChecklist: (id: string, data: Partial<ChecklistNote>) => Promise<void>;
  resetNotes: () => void;
  moveToFolder: (id: string, folderId: string | null, type: 'note' | 'checklist' | 'idea') => Promise<void>;
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
      const savedPriorities = await loadPriorities();

      const allNotes = await getNotes();
      const formattedNotes = allNotes.map((n: any) => {
        const normalized = normalizeNote(n);
        if (n.type === 'checklist' && n.items) {
          normalized.items = normalized.items.map((item: any) => {
            const sp = savedPriorities[item.id];
            return sp ? { ...item, priority: sp } : item;
          });
        }
        return normalized;
      });

      set({
        notes: formattedNotes.filter((n: any) => n.type === 'note'),
        checklists: formattedNotes.filter((n: any) => n.type === 'checklist'),
        ideas: formattedNotes.filter((n: any) => n.type === 'idea'),
        isLoading: false,
        error: null,
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
      const res = await createNote({ title: note.title, type: 'checklist', reminderDate: note.reminderDate, latitude: note.latitude, longitude: note.longitude, folderId: note.folderId });
      let newChecklist = normalizeNote(res);
      const itemList = (note.items ?? []).map((item) => typeof item === 'string' ? { text: item, priority: undefined } : item).filter((i) => i.text.trim());
      let partialSaveError: string | null = null;

      if (itemList.length > 0) {
        const createdItems: ChecklistItem[] = [];
        const savedPriorities: Record<string, ItemPriority> = {};

        for (const item of itemList) {
          try {
            const createdItem = await addChecklistItemApi(newChecklist.id, item.text, item.priority);
            if (item.priority && item.priority !== 'none') savedPriorities[createdItem.id] = item.priority;
            createdItems.push(normalizeChecklistItem(createdItem));
          } catch (error) {
            partialSaveError = 'La tarea se creo, pero no se pudieron guardar todas sus subtareas.';
            break;
          }
        }

        if (Object.keys(savedPriorities).length > 0) {
          const existing = await loadPriorities();
          savePriorities({ ...existing, ...savedPriorities });
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

  archiveNote: async (id) => {
    try {
      await updateNoteApi(id, { archived: true });
      set((state) => ({
        notes: state.notes.map((n) => n.id === id ? { ...n, archived: true } : n),
        checklists: state.checklists.map((c) => c.id === id ? { ...c, archived: true } : c),
        ideas: state.ideas.map((i) => i.id === id ? { ...i, archived: true } : i),
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  restoreNote: async (id) => {
    try {
      await updateNoteApi(id, { archived: false });
      set((state) => ({
        notes: state.notes.map((n) => n.id === id ? { ...n, archived: false } : n),
        checklists: state.checklists.map((c) => c.id === id ? { ...c, archived: false } : c),
        ideas: state.ideas.map((i) => i.id === id ? { ...i, archived: false } : i),
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  addChecklistItem: async (checklistId, text, priority) => {
    try {
      const newItem = await addChecklistItemApi(checklistId, text, priority);
      if (priority && priority !== 'none') {
        const saved = await loadPriorities();
        saved[newItem.id] = priority;
        savePriorities(saved);
      }
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
      const saved = await loadPriorities();
      if (saved[itemId]) {
        delete saved[itemId];
        savePriorities(saved);
      }
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
      await updateChecklistItemApi(itemId, { text });
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

  updateItemPriority: (checklistId, itemId, priority) => {
    set((state) => {
      const priorities: Record<string, ItemPriority> = {};
      for (const c of state.checklists) {
        for (const i of c.items) {
          if (i.priority && i.priority !== 'none' && i.id !== itemId) priorities[i.id] = i.priority;
        }
      }
      if (priority !== 'none') priorities[itemId] = priority;
      savePriorities(priorities);
      return {
        checklists: state.checklists.map((c) =>
          c.id === checklistId
            ? { ...c, items: (c.items || []).map((i) => i.id === itemId ? { ...i, priority } : i) }
            : c
        ),
      };
    });
    updateChecklistItemApi(itemId, { priority }).catch(() => {});
  },

  updateNote: async (id, data) => {
    set((state) => ({
      notes: state.notes.map((n) => (n.id === id ? { ...n, ...data } : n)),
    }));
    try {
      await updateNoteApi(id, data);
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updateIdea: async (id, data) => {
    set((state) => ({
      ideas: state.ideas.map((i) => (i.id === id ? { ...i, ...data } : i)),
    }));
    try {
      await updateNoteApi(id, data);
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updateChecklist: async (id, data) => {
    set((state) => ({
      checklists: state.checklists.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }));
    try {
      await updateNoteApi(id, data);
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  toggleChecklistItem: (checklistId, itemId, currentStatus) => {
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
    toggleChecklistItemApi(itemId, !currentStatus).catch(() => {});
  },

  moveToFolder: async (id: string, folderId: string | null, type: 'note' | 'checklist' | 'idea') => {
    set((state) => {
      const updater = (items: any[]) => items.map((n) => n.id === id ? { ...n, folderId } : n);
      if (type === 'note') return { notes: updater(state.notes) };
      if (type === 'checklist') return { checklists: updater(state.checklists) };
      return { ideas: updater(state.ideas) };
    });
    try {
      await updateNoteApi(id, { folderId });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  resetNotes: () => set({ notes: [], checklists: [], ideas: [], isLoading: false, error: null }),
}));
