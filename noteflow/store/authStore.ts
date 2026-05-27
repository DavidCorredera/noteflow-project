import { create } from 'zustand';
import { auth, firestore, FirebaseUser } from '../lib/firebase';
import { useNotesStore } from './notesStore';

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt: number;
};

type AuthState = {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: FirebaseUser | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  loadProfile: (uid: string) => Promise<void>;
  updateProfile: (data: Partial<Pick<UserProfile, 'name' | 'avatarUrl'>>) => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),

  login: async (email, password) => {
    await auth.signInWithEmailAndPassword(email, password);
  },

  register: async (email, password, name) => {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const userId = userCredential.uid;

    try {
      await firestore.collection('users').doc(userId).set({
        name,
        email,
        createdAt: firestore.FieldValue.serverTimestamp(),
        avatarUrl: null,
      });
    } catch {
      console.warn('Firestore write failed, user still created in Auth');
    }
  },

  logout: async () => {
    await auth.signOut();
    useNotesStore.getState().resetNotes();
    set({ user: null, profile: null });
  },

  loadProfile: async (uid) => {
    const doc = await firestore.collection('users').doc(uid).get();
    if (doc.exists()) {
      const data = doc.data();
      if (data) set({ profile: { uid, ...data } as UserProfile });
    }
  },

  updateProfile: async (data) => {
    const user = get().user;
    if (!user) return;
    await firestore.collection('users').doc(user.uid).update(data);
    set({ profile: get().profile ? { ...get().profile!, ...data } : null });
  },
}));
