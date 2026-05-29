import { create } from 'zustand';
import { Folder } from '../types';
import { getFoldersApi, createFolderApi, updateFolderApi, deleteFolderApi } from '../lib/api';

type FolderType = 'note' | 'checklist' | 'idea';

interface FolderState {
  foldersByType: Record<FolderType, Folder[]>;
  isLoading: boolean;
  error: string | null;
  fetchFolders: (type: FolderType) => Promise<void>;
  resetFolders: () => void;
  createFolder: (name: string, color: string, type: FolderType) => Promise<Folder | null>;
  updateFolder: (id: string, data: { name?: string; color?: string }) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
}

const emptyByType: Record<FolderType, Folder[]> = { note: [], checklist: [], idea: [] };

export const useFolderStore = create<FolderState>((set, get) => ({
  foldersByType: { ...emptyByType },
  isLoading: false,
  error: null,

  fetchFolders: async (type) => {
    set({ isLoading: true, error: null });
    try {
      const data = await getFoldersApi(type);
      const folders: Folder[] = (data.folders ?? data ?? []).map((f: any) => ({
        ...f,
        createdAt: new Date(f.created_at ?? f.createdAt),
        updatedAt: new Date(f.updated_at ?? f.updatedAt),
      }));
      set((state) => ({ foldersByType: { ...state.foldersByType, [type]: folders }, isLoading: false }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  resetFolders: () => set({ foldersByType: { ...emptyByType } }),

  createFolder: async (name, color, type) => {
    try {
      const data = await createFolderApi({ name, color, type });
      const folder: Folder = {
        ...data,
        createdAt: new Date(data.created_at ?? data.createdAt),
        updatedAt: new Date(data.updated_at ?? data.updatedAt),
      };
      set((state) => ({ foldersByType: { ...state.foldersByType, [type]: [...state.foldersByType[type], folder] } }));
      return folder;
    } catch (error: any) {
      set({ error: error.message });
      return null;
    }
  },

  updateFolder: async (id, data) => {
    try {
      await updateFolderApi(id, data);
      set((state) => {
        const next = { ...state.foldersByType };
        for (const t of ['note', 'checklist', 'idea'] as FolderType[]) {
          next[t] = next[t].map((f) => f.id === id ? { ...f, ...data, updatedAt: new Date() } : f);
        }
        return { foldersByType: next };
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteFolder: async (id) => {
    try {
      await deleteFolderApi(id);
      set((state) => {
        const next = { ...state.foldersByType };
        for (const t of ['note', 'checklist', 'idea'] as FolderType[]) {
          next[t] = next[t].filter((f) => f.id !== id);
        }
        return { foldersByType: next };
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },
}));
