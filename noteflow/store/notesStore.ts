import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note, ChecklistNote, IdeaNote, ChecklistItem } from '../types'; // <-- Asegúrate de importar ChecklistItem

interface NotesStore {
  notes: Note[];
  checklists: ChecklistNote[];
  ideas: IdeaNote[];
  addNote: (note: Note) => void;
  addChecklist: (note: ChecklistNote) => void;
  addIdea: (note: IdeaNote) => void;
  deleteNote: (id: string) => void;
  toggleChecklistItem: (checklistId: string, itemId: string) => void;
  // NUEVO: Función para añadir subtareas
  addChecklistItem: (checklistId: string, item: ChecklistItem) => void; 
}

export const useNotesStore = create<NotesStore>()(
  persist(
    (set) => ({
      notes: [],
      checklists: [],
      ideas: [],
      
      addNote: (note) => set((state) => ({ notes: [...state.notes, note] })),
      addChecklist: (note) => set((state) => ({ checklists: [...state.checklists, note] })),
      addIdea: (note) => set((state) => ({ ideas: [...state.ideas, note] })),
      
      deleteNote: (id) => set((state) => ({ 
        notes: state.notes.filter(n => n.id !== id),
        checklists: state.checklists.filter(c => c.id !== id),
        ideas: state.ideas.filter(i => i.id !== id),
      })),

      // NUEVO: Añadimos el ítem al array de items de la checklist correcta
      addChecklistItem: (checklistId, item) => set((state) => ({
        checklists: state.checklists.map(c =>
          c.id !== checklistId ? c : { ...c, items: [...c.items, item], updatedAt: new Date() }
        ),
      })),
      
      toggleChecklistItem: (checklistId, itemId) => set((state) => ({
        checklists: state.checklists.map(c =>
          c.id !== checklistId ? c : {
            ...c,
            items: c.items.map(i => i.id === itemId ? { ...i, isCompleted: !i.isCompleted } : i)
          }
        ),
      })),
    }),
    {
      name: 'noteflow-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);