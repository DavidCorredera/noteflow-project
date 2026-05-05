import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note, ChecklistNote, IdeaNote, ChecklistItem } from '../types';

interface NotesStore {
  notes: Note[];
  checklists: ChecklistNote[];
  ideas: IdeaNote[];
  addNote: (note: Note) => void;
  addChecklist: (note: ChecklistNote) => void;
  addIdea: (note: IdeaNote) => void;
  deleteNote: (id: string) => void;
  toggleChecklistItem: (checklistId: string, itemId: string) => void;
  addChecklistItem: (checklistId: string, item: ChecklistItem) => void;
}

export const useNotesStore = create<NotesStore>()(
  persist(
    (set) => ({
      notes: [],
      checklists: [],
      ideas: [],
      
      // Añadimos (state.notes || []) para evitar el error si el campo no existe en el disco
      addNote: (note) => set((state) => ({ 
        notes: [...(state.notes || []), note] 
      })),
      
      addChecklist: (note) => set((state) => ({ 
        checklists: [...(state.checklists || []), note] 
      })),
      
      addIdea: (note) => set((state) => ({ 
        ideas: [...(state.ideas || []), note] 
      })),
      
      deleteNote: (id) => set((state) => ({ 
        notes: (state.notes || []).filter(n => n.id !== id),
        checklists: (state.checklists || []).filter(c => c.id !== id),
        ideas: (state.ideas || []).filter(i => i.id !== id),
      })),

      addChecklistItem: (checklistId, item) => set((state) => ({
        checklists: (state.checklists || []).map(c =>
          c.id !== checklistId ? c : { 
            ...c, 
            items: [...(c.items || []), item], 
            updatedAt: new Date() 
          }
        ),
      })),
      
      toggleChecklistItem: (checklistId, itemId) => set((state) => ({
        checklists: (state.checklists || []).map(c =>
          c.id !== checklistId ? c : {
            ...c,
            items: (c.items || []).map(i => i.id === itemId ? { ...i, isCompleted: !i.isCompleted } : i)
          }
        ),
      })),
    }),
    {
      name: 'noteflow-v2-storage', // Cambiamos el nombre a v2 para forzar un inicio limpio
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);