import { create } from 'zustand';
import { auth, firestore } from '../lib/firebase';
import { useNotesStore } from './notesStore';
import { useFolderStore } from './folderStore';

interface SavedAccount {
  email: string;
  password: string;
  uid: string;
  name: string;
  avatarUrl: string | null;
}

interface LinkedAccountInfo {
  email: string;
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
  saveCurrentAccountCredentials: (email: string, password: string) => Promise<void>;
  switchToAccount: (email: string) => Promise<void>;
  removeAccount: (email: string) => Promise<void>;
  updateAccountProfile: (email: string, data: Partial<Pick<SavedAccount, 'name' | 'avatarUrl'>>) => Promise<void>;
  setAccountPassword: (email: string, password: string) => Promise<void>;
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

async function fetchLinkedAccountsFromFirestore(uid: string): Promise<LinkedAccountInfo[]> {
  try {
    const doc = await firestore.collection('users').doc(uid).get();
    const data = doc.data();
    if (data?.linkedAccounts && Array.isArray(data.linkedAccounts)) {
      return data.linkedAccounts;
    }
  } catch {}
  return [];
}

async function saveLinkedAccountToFirestore(adderUid: string, info: LinkedAccountInfo) {
  try {
    const docRef = firestore.collection('users').doc(adderUid);
    const snap = await docRef.get();
    const data = snap.data() || {};
    const linkedAccounts: LinkedAccountInfo[] = (data.linkedAccounts || []) as LinkedAccountInfo[];
    if (!linkedAccounts.find((la: LinkedAccountInfo) => la.email === info.email)) {
      linkedAccounts.push(info);
    }
    await docRef.set({ ...data, linkedAccounts });
  } catch {}
}

async function removeLinkedAccountFromFirestore(adderUid: string, email: string) {
  try {
    const docRef = firestore.collection('users').doc(adderUid);
    const snap = await docRef.get();
    const data = snap.data() || {};
    const linkedAccounts: LinkedAccountInfo[] = ((data.linkedAccounts || []) as LinkedAccountInfo[]).filter(
      (la: LinkedAccountInfo) => la.email !== email
    );
    await docRef.set({ ...data, linkedAccounts });
  } catch {}
}

export const useAccountStore = create<AccountState>((set, get) => ({
  accounts: [],
  activeEmail: null,
  loaded: false,

  loadAccounts: async () => {
    const state = get();
    if (state.loaded) return;
    try {
      const raw = await loadFromStorage();
      let accounts: SavedAccount[] = [];
      let activeEmail = auth.currentUser?.email ?? null;

      if (raw) {
        accounts = JSON.parse(raw);
      }

      const currentUser = auth.currentUser;
      if (currentUser) {
        const linked = await fetchLinkedAccountsFromFirestore(currentUser.uid);
        const existingEmails = new Set(accounts.map((a) => a.email));
        for (const la of linked) {
          if (!existingEmails.has(la.email)) {
            accounts.push({
              email: la.email,
              password: '',
              uid: la.uid,
              name: la.name || '',
              avatarUrl: la.avatarUrl || null,
            });
            existingEmails.add(la.email);
          }
        }
      }

      set({
        accounts,
        activeEmail,
        loaded: true,
      });
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

    const adderEmail = state.activeEmail;
    const adderAccount = state.accounts.find((a) => a.email === adderEmail);
    if (!adderAccount) {
      throw new Error('No active account found');
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

    await auth.signInWithEmailAndPassword(adderAccount.email, adderAccount.password);
    await saveLinkedAccountToFirestore(adderAccount.uid, {
      email: newAccount.email,
      uid: newAccount.uid,
      name: newAccount.name,
      avatarUrl: newAccount.avatarUrl,
    });

    await auth.signInWithEmailAndPassword(email, password);

    const updated = [...state.accounts, newAccount];
    await saveToStorage(updated);
    useNotesStore.getState().resetNotes();
    await useNotesStore.getState().fetchNotes();
    set({ accounts: updated, activeEmail: email });
  },

  saveCurrentAccountCredentials: async (email, password) => {
    const state = get();
    const existing = state.accounts.find((a) => a.email === email);

    if (existing) {
      const updated = state.accounts.map((a) =>
        a.email === email ? { ...a, password } : a
      );
      await saveToStorage(updated);
      set({ accounts: updated });
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.email !== email) return;

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
    set({ accounts: updated, activeEmail: email });
  },

  switchToAccount: async (email) => {
    const state = get();
    const account = state.accounts.find((a) => a.email === email);
    if (!account) throw new Error('Cuenta no encontrada');

    if (!account.password) {
      throw new Error('no_password');
    }

    await auth.signInWithEmailAndPassword(account.email, account.password);
    useNotesStore.getState().resetNotes();
    useFolderStore.getState().resetFolders();
    await Promise.all([
      useNotesStore.getState().fetchNotes(),
      useFolderStore.getState().fetchFolders('note'),
      useFolderStore.getState().fetchFolders('checklist'),
      useFolderStore.getState().fetchFolders('idea'),
    ]);
    set({ activeEmail: email });
  },

  removeAccount: async (email) => {
    const state = get();
    const updated = state.accounts.filter((a) => a.email !== email);
    await saveToStorage(updated);
    set({ accounts: updated });

    const currentUser = auth.currentUser;
    if (currentUser) {
      await removeLinkedAccountFromFirestore(currentUser.uid, email);
    }

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

  setAccountPassword: async (email, password) => {
    const state = get();
    const updated = state.accounts.map((a) =>
      a.email === email ? { ...a, password } : a
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
