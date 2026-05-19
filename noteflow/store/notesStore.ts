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

interface NotesStore {
  notes: Note[];
  checklists: ChecklistNote[];
  ideas: IdeaNote[];
  isLoading: boolean;
  error: string | null;
  
  fetchNotes: () => Promise<void>;
  addNote: (note: Omit<Note, 'id'>) => Promise<void>;
  addChecklist: (note: Omit<ChecklistNote, 'id'>) => Promise<void>;
  addIdea: (note: Omit<IdeaNote, 'id'>) => Promise<void>;
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

  // 1. Carga inicial desde el servidor
  fetchNotes: async () => {
    set({ isLoading: true, error: null });
    try {
      const allNotes = await getNotes();
      
      const formattedNotes = allNotes.map((n: any) => ({
        ...n,
        createdAt: new Date(n.created_at),
        updatedAt: new Date(n.updated_at),
        items: n.items || [],
        tags: n.tags || [],
      }));

      set({
        notes: formattedNotes.filter((n: any) => n.type === 'note'),
        checklists: formattedNotes.filter((n: any) => n.type === 'checklist'),
        ideas: formattedNotes.filter((n: any) => n.type === 'idea'),
        isLoading: false
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // 2. Crear datos
  addNote: async (note) => {
    try {
      const res = await createNote({ ...note, type: 'note' });
      const newNote = { ...res, createdAt: new Date(res.created_at), updatedAt: new Date(res.updated_at) };
      set((state) => ({ notes: [newNote, ...state.notes] }));
    } catch (error: any) { set({ error: error.message }); }
  },

  addChecklist: async (note) => {
    try {
      const res = await createNote({ ...note, type: 'checklist' });
      const newChecklist = { ...res, createdAt: new Date(res.created_at), updatedAt: new Date(res.updated_at), items: [] };
      set((state) => ({ checklists: [newChecklist, ...state.checklists] }));
    } catch (error: any) { set({ error: error.message }); }
  },

  addIdea: async (note) => {
    try {
      const res = await createNote({ ...note, type: 'idea' });
      const newIdea = { ...res, createdAt: new Date(res.created_at), updatedAt: new Date(res.updated_at), tags: note.tags || [] };
      set((state) => ({ ideas: [newIdea, ...state.ideas] }));
    } catch (error: any) { set({ error: error.message }); }
  },

  // 3. Borrar datos
  deleteNote: async (id) => {
    try {
      await deleteNoteApi(id);
      // Actualizamos la UI localmente
      set((state) => ({
        notes: state.notes.filter(n => n.id !== id),
        checklists: state.checklists.filter(c => c.id !== id),
        ideas: state.ideas.filter(i => i.id !== id),
      }));
    } catch (error: any) { set({ error: error.message }); }
  },

  // 4. Manejo de ítems de checklist
  addChecklistItem: async (checklistId, text) => {
    try {
      const newItem = await addChecklistItemApi(checklistId, text);
      set((state) => ({
        checklists: state.checklists.map(c => 
          c.id === checklistId 
            ? { ...c, items: [...(c.items || []), newItem] } 
            : c
        )
      }));
    } catch (error: any) { set({ error: error.message }); }
  },

  deleteChecklistItem: async (checklistId, itemId) => {
    try {
      await deleteChecklistItemApi(itemId);
      set((state) => ({
        checklists: state.checklists.map(c =>
          c.id === checklistId
            ? { ...c, items: (c.items || []).filter(i => i.id !== itemId) }
            : c
        )
      }));
    } catch (error: any) { set({ error: error.message }); }
  },

  updateChecklistItem: async (checklistId, itemId, text) => {
    try {
      await updateChecklistItemApi(itemId, text);
      set((state) => ({
        checklists: state.checklists.map(c =>
          c.id === checklistId
            ? { ...c, items: (c.items || []).map(i => i.id === itemId ? { ...i, text } : i) }
            : c
        )
      }));
    } catch (error: any) { set({ error: error.message }); }
  },

  updateNote: async (id, data) => {
    try {
      const updated = await updateNoteApi(id, data);
      set((state) => ({
        notes: state.notes.map(n => n.id === id ? { ...n, ...updated, ...data } : n),
      }));
    } catch (error: any) { set({ error: error.message }); }
  },

  updateIdea: async (id, data) => {
    try {
      const updated = await updateNoteApi(id, data);
      set((state) => ({
        ideas: state.ideas.map(i => i.id === id ? { ...i, ...updated, ...data } : i),
      }));
    } catch (error: any) { set({ error: error.message }); }
  },

  updateChecklist: async (id, data) => {
    try {
      const updated = await updateNoteApi(id, data);
      set((state) => ({
        checklists: state.checklists.map(c => c.id === id ? { ...c, ...updated, ...data } : c),
      }));
    } catch (error: any) { set({ error: error.message }); }
  },

  toggleChecklistItem: async (checklistId, itemId, currentStatus) => {
    // Para dar sensación de rapidez (Optimistic UI), actualizamos la UI antes de que la API responda
    set((state) => ({
      checklists: state.checklists.map(c => 
        c.id === checklistId 
          ? { ...c, items: (c.items || []).map(i => i.id === itemId ? { ...i, isCompleted: !currentStatus } : i) }
          : c
      )
    }));

    try {
      await toggleChecklistItemApi(itemId, !currentStatus);
    } catch (error: any) {
      // Si la API falla, revertimos el cambio (opcional, pero buena práctica)
      get().fetchNotes(); 
      set({ error: error.message });
    }
  },
}));