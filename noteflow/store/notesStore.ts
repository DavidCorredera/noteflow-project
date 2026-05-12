import { create } from 'zustand';
import { Note, ChecklistNote, IdeaNote, ChecklistItem } from '../types';
import { 
  getNotes, 
  createNote, 
  deleteNoteApi, 
  addChecklistItemApi, 
  toggleChecklistItemApi 
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
        items: n.items || [], // <--- ¡Salvavidas para ChecklistCard!
        tags: n.tags || [],   // <--- ¡Salvavidas para IdeaCard!
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
      const newNote = await createNote({ ...note, type: 'note' });
      set((state) => ({ notes: [newNote, ...state.notes] }));
    } catch (error: any) { set({ error: error.message }); }
  },

  addChecklist: async (note) => {
    try {
      const newChecklist = await createNote({ ...note, type: 'checklist' });
      // Aseguramos que tenga el array de items vacío para la UI
      newChecklist.items = [];
      set((state) => ({ checklists: [newChecklist, ...state.checklists] }));
    } catch (error: any) { set({ error: error.message }); }
  },

  addIdea: async (note) => {
    try {
      const newIdea = await createNote({ ...note, type: 'idea' });
      newIdea.tags = note.tags || []; // <--- ¡Salvavidas al crear una nueva!
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