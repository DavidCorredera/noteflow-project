import { create } from 'zustand';

interface ToastState {
  message: string;
  showToast: (msg: string) => void;
  clearToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: '',
  showToast: (msg) => set({ message: msg }),
  clearToast: () => set({ message: '' }),
}));
