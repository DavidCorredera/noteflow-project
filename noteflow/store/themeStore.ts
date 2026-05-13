import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeStore {
  isDarkMode: boolean;
  sortBy: 'recent' | 'oldest' | 'alpha';
  notifications: boolean;
  loaded: boolean;
  load: () => Promise<void>;
  toggleTheme: () => void;
  setSortBy: (sort: 'recent' | 'oldest' | 'alpha') => void;
  toggleNotifications: () => void;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  isDarkMode: false,
  sortBy: 'recent',
  notifications: true,
  loaded: false,

  load: async () => {
    try {
      const dark = await AsyncStorage.getItem('noteflow_dark');
      const sort = await AsyncStorage.getItem('noteflow_sort');
      const notif = await AsyncStorage.getItem('noteflow_notif');
      set({
        isDarkMode: dark === 'true',
        sortBy: (sort as any) || 'recent',
        notifications: notif !== 'false',
        loaded: true,
      });
    } catch {
      set({ loaded: true });
    }
  },

  toggleTheme: async () => {
    const next = !get().isDarkMode;
    set({ isDarkMode: next });
    await AsyncStorage.setItem('noteflow_dark', String(next));
  },

  setSortBy: async (sortBy) => {
    set({ sortBy });
    await AsyncStorage.setItem('noteflow_sort', sortBy);
  },

  toggleNotifications: async () => {
    const next = !get().notifications;
    set({ notifications: next });
    await AsyncStorage.setItem('noteflow_notif', String(next));
  },
}));
