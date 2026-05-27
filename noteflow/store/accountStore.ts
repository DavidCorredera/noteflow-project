import { create } from 'zustand';
import { auth, firestore } from '../lib/firebase';
import { useNotesStore } from './notesStore';

interface SavedAccount {
  email: string;
  password: string;
  uid: string;
  name: string;
  avatarUrl: string | null;
}

interface AccountState {
  accounts: SavedAccount[];
  activeEmail: string | null;
  loaded: boolean;
  loadAccounts: () => Promise<void>;
  addAccount: (email: string, password: string) => Promise<void>;
  switchToAccount: (email: string) => Promise<void>;
  removeAccount: (email: string) => Promise<void>;
  updateAccountProfile: (email: string, data: Partial<Pick<SavedAccount, 'name' | 'avatarUrl'>>) => Promise<void>;
}

let SecureStore: any;
try {
  SecureStore = require('expo-secure-store');
} catch {}

const AsyncStorage: any = (() => {
  try { return require('@react-native-async-storage/async-storage').default; } catch { return null; }
})();

const STORAGE_KEY = 'noteflow_accounts';
const MAX_ACCOUNTS = 5;

async function saveToStorage(accounts: SavedAccount[]) {
  const data = JSON.stringify(accounts);
  if (SecureStore) {
    await SecureStore.setItemAsync(STORAGE_KEY, data);
  } else if (AsyncStorage) {
    await AsyncStorage.setItem(STORAGE_KEY, data);
  }
}

async function loadFromStorage(): Promise<string | null> {
  if (SecureStore) {
    return SecureStore.getItemAsync(STORAGE_KEY);
  } else if (AsyncStorage) {
    return AsyncStorage.getItem(STORAGE_KEY);
  }
  return null;
}

export const useAccountStore = create<AccountState>((set, get) => ({
  accounts: [],
  activeEmail: null,
  loaded: false,

  loadAccounts: async () => {
    try {
      const raw = await loadFromStorage();
      if (raw) {
        const accounts: SavedAccount[] = JSON.parse(raw);
        const currentUser = auth.currentUser;
        set({
          accounts,
          activeEmail: currentUser?.email ?? null,
          loaded: true,
        });
      } else {
        // First launch: save current user if signed in
        const currentUser = auth.currentUser;
        if (currentUser?.email) {
          const profile = await loadProfileOnce(currentUser.uid);
          const initial: SavedAccount = {
            email: currentUser.email,
            password: '',
            uid: currentUser.uid,
            name: profile?.name || '',
            avatarUrl: profile?.avatarUrl || null,
          };
          await saveToStorage([initial]);
          set({ accounts: [initial], activeEmail: currentUser.email, loaded: true });
        } else {
          set({ loaded: true });
        }
      }
    } catch {
      set({ loaded: true });
    }
  },

  addAccount: async (email, password) => {
    const state = get();
    if (state.accounts.length >= MAX_ACCOUNTS) {
      throw new Error(`Máximo de ${MAX_ACCOUNTS} cuentas permitidas`);
    }
    if (state.accounts.find((a) => a.email === email)) {
      throw new Error('Esta cuenta ya está añadida');
    }

    let currentUser;
    try {
      await auth.signInWithEmailAndPassword(email, password);
      currentUser = auth.currentUser!;
    } catch (signInErr: any) {
      if (signInErr.code === 'auth/invalid-credential' || signInErr.code === 'auth/user-not-found') {
        try {
          await auth.createUserWithEmailAndPassword(email, password);
          currentUser = auth.currentUser!;
          await firestore.collection('users').doc(currentUser.uid).set({
            name: email.split('@')[0],
            email,
            avatarUrl: null,
            createdAt: firestore.FieldValue.serverTimestamp(),
          });
        } catch (registerErr: any) {
          if (registerErr.code === 'auth/email-already-in-use') {
            throw new Error('Esta cuenta ya existe. Verifica la contraseña.');
          }
          throw registerErr;
        }
      } else {
        throw signInErr;
      }
    }
    const profile = await loadProfileOnce(currentUser.uid);

    const newAccount: SavedAccount = {
      email,
      password,
      uid: currentUser.uid,
      name: profile?.name || '',
      avatarUrl: profile?.avatarUrl || null,
    };

    const updated = [...state.accounts, newAccount];
    await saveToStorage(updated);
    useNotesStore.getState().resetNotes();
    await useNotesStore.getState().fetchNotes();
    set({ accounts: updated, activeEmail: email });
  },

  switchToAccount: async (email) => {
    const state = get();
    const account = state.accounts.find((a) => a.email === email);
    if (!account) throw new Error('Cuenta no encontrada');

    if (!account.password) {
      throw new Error('Esta cuenta no tiene contraseña guardada');
    }

    await auth.signInWithEmailAndPassword(account.email, account.password);
    useNotesStore.getState().resetNotes();
    await useNotesStore.getState().fetchNotes();
    set({ activeEmail: email });
  },

  removeAccount: async (email) => {
    const state = get();
    const updated = state.accounts.filter((a) => a.email !== email);
    await saveToStorage(updated);
    set({ accounts: updated });

    // If removing active account, switch to another or sign out
    if (state.activeEmail === email) {
      if (updated.length > 0) {
        await get().switchToAccount(updated[0].email);
      } else {
        await auth.signOut();
        set({ activeEmail: null });
      }
    }
  },

  updateAccountProfile: async (email, data) => {
    const state = get();
    const updated = state.accounts.map((a) =>
      a.email === email ? { ...a, ...data } : a
    );
    await saveToStorage(updated);
    set({ accounts: updated });
  },
}));

async function loadProfileOnce(uid: string) {
  try {
    const doc = await firestore.collection('users').doc(uid).get();
    if (doc.exists()) {
      return doc.data();
    }
  } catch {}
  return null;
}
