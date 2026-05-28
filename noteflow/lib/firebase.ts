import { Platform } from 'react-native';
import { FIREBASE_API_KEY } from './env';

type NativeAuth = ReturnType<typeof import('@react-native-firebase/auth').default>;
type NativeFirestore = ReturnType<typeof import('@react-native-firebase/firestore').default>;

let isNative = false;

function tryNativeAuth(): NativeAuth | null {
  try {
    const m = require('@react-native-firebase/auth');
    if (m?.default) return m.default();
  } catch {}
  return null;
}

function tryNativeFirestore(): { instance: NativeFirestore; FieldValue: any } | null {
  try {
    const m = require('@react-native-firebase/firestore');
    if (m?.default) return { instance: m.default(), FieldValue: m.default.FieldValue };
  } catch {}
  return null;
}

const nativeAuth = tryNativeAuth();
const nativeFs = tryNativeFirestore();

if (nativeAuth && nativeFs) {
  isNative = true;
}

interface FirestoreDocRef {
  get: () => Promise<{ data: () => any; exists: () => boolean }>;
  set: (data: any) => Promise<void>;
  update: (data: any) => Promise<void>;
}

interface FirestoreCollectionRef {
  doc: (id: string) => FirestoreDocRef;
}

interface FirestoreInstance {
  collection: (path: string) => FirestoreCollectionRef;
  FieldValue: { serverTimestamp: () => any };
}

let auth: {
  currentUser: { uid: string; email: string | null; getIdToken: () => Promise<string> } | null;
  signInWithEmailAndPassword: (email: string, password: string) => Promise<{ uid: string; email: string | null; getIdToken: () => Promise<string> }>;
  createUserWithEmailAndPassword: (email: string, password: string) => Promise<{ uid: string; email: string | null; getIdToken: () => Promise<string> }>;
  onAuthStateChanged: (callback: (user: any) => void) => () => void;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

let firestore: FirestoreInstance;

if (isNative) {
  const na = nativeAuth!;
  const nf = nativeFs!;
  auth = {
    get currentUser() { return na.currentUser as any; },
    signInWithEmailAndPassword: (e, p) => na.signInWithEmailAndPassword(e, p).then((r: any) => r.user),
    createUserWithEmailAndPassword: (e, p) => na.createUserWithEmailAndPassword(e, p).then((r: any) => r.user),
    onAuthStateChanged: (cb) => na.onAuthStateChanged(cb),
    sendPasswordResetEmail: (e) => na.sendPasswordResetEmail(e),
    signOut: () => na.signOut(),
  };
  firestore = {
    collection: (path) => ({
      doc: (id) => ({
        get: async () => {
          const snap = await nf.instance.collection(path).doc(id).get();
          return { data: () => snap.data(), exists: () => snap.exists() };
        },
        set: (data) => nf.instance.collection(path).doc(id).set(data),
        update: (data) => nf.instance.collection(path).doc(id).update(data),
      }),
    }),
    FieldValue: { serverTimestamp: () => nf.FieldValue.serverTimestamp() },
  };
} else {
  const { initializeApp } = require('firebase/app');
  const fbAuth = require('firebase/auth');
  const fbFs = require('firebase/firestore');
  const ReactNativeAsyncStorage = require('@react-native-async-storage/async-storage').default;

  const firebaseConfig = {
    apiKey: FIREBASE_API_KEY,
    authDomain: 'noteflow-86105.firebaseapp.com',
    projectId: 'noteflow-86105',
    storageBucket: 'noteflow-86105.firebasestorage.app',
  };

  const app = initializeApp(firebaseConfig);
  const fbAuthInstance = fbAuth.initializeAuth(app, {
    persistence: fbAuth.getReactNativePersistence(ReactNativeAsyncStorage),
  });
  let currentUser: any = null;

  fbAuth.onAuthStateChanged(fbAuthInstance, (user: any) => {
    currentUser = user;
  });

  const makeUser = (u: any) => u ? { uid: u.uid, email: u.email, getIdToken: () => u.getIdToken() } : null;

  auth = {
    get currentUser() { return makeUser(currentUser); },
    signInWithEmailAndPassword: async (email, password) => {
      const r = await fbAuth.signInWithEmailAndPassword(fbAuthInstance, email, password);
      currentUser = r.user;
      return makeUser(r.user)!;
    },
    createUserWithEmailAndPassword: async (email, password) => {
      const r = await fbAuth.createUserWithEmailAndPassword(fbAuthInstance, email, password);
      currentUser = r.user;
      return makeUser(r.user)!;
    },
    onAuthStateChanged: (cb) => {
      return fbAuth.onAuthStateChanged(fbAuthInstance, (user: any) => {
        currentUser = user;
        cb(user ? makeUser(user) : null);
      });
    },
    sendPasswordResetEmail: (email) => fbAuth.sendPasswordResetEmail(fbAuthInstance, email),
    signOut: async () => {
      await fbAuth.signOut(fbAuthInstance);
      currentUser = null;
    },
  };

  const fs = fbFs.getFirestore(app);
  firestore = {
    collection: (path) => ({
      doc: (id) => ({
        get: async () => {
          const snap = await fbFs.getDoc(fbFs.doc(fs, path, id));
          return { data: () => snap.data(), exists: () => typeof snap.exists === 'function' ? snap.exists() : snap.exists };
        },
        set: (data) => fbFs.setDoc(fbFs.doc(fs, path, id), data),
        update: (data) => fbFs.updateDoc(fbFs.doc(fs, path, id), data),
      }),
    }),
    FieldValue: { serverTimestamp: () => fbFs.serverTimestamp() },
  };
}

export interface FirebaseUser {
  uid: string;
  email: string | null;
  getIdToken: () => Promise<string>;
}

export { auth, firestore, isNative };
