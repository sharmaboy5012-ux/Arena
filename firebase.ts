import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  arrayUnion,
  Timestamp
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC5CITkfMxbBk6bTGgLxbWyp2-1N3QofkI",
  authDomain: "funturna-d9753.firebaseapp.com",
  projectId: "funturna-d9753",
  storageBucket: "funturna-d9753.firebasestorage.app",
  messagingSenderId: "433301349680",
  appId: "1:433301349680:web:a7a4609d20043874c4d4f5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Timeout wrapper — prevents infinite hanging
const withTimeout = <T>(promise: Promise<T>, ms = 10000, label = 'Operation'): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} timed out (${ms}ms)`)), ms))
  ]);
};

// Auth helpers with timeout
export const signInWithGoogle = async () => {
  googleProvider.setCustomParameters({ prompt: 'select_account' });
  return signInWithPopup(auth, googleProvider);
};
export const signInWithEmail = (e: string, p: string) => 
  withTimeout(signInWithEmailAndPassword(auth, e, p), 15000, 'Login');
export const signUpWithEmail = (e: string, p: string) => 
  withTimeout(createUserWithEmailAndPassword(auth, e, p), 15000, 'Signup');
export const logOut = () => signOut(auth);
export const sendVerifyEmail = (user: FirebaseUser) => sendEmailVerification(user);
export const sendResetPassword = (email: string) => sendPasswordResetEmail(auth, email);

// Collections
export const usersRef = collection(db, 'users');
export const tournamentsRef = collection(db, 'tournaments');
export const transactionsRef = collection(db, 'transactions');
export const notificationsRef = collection(db, 'notifications');
export const withdrawRequestsRef = collection(db, 'withdrawRequests');
export const depositRequestsRef = collection(db, 'depositRequests');
export const communityRef = collection(db, 'community');

// Helpers
export const generateReferralCode = (nickname: string): string =>
  nickname.substring(0, 3).toUpperCase() + Math.random().toString(36).substring(2, 7).toUpperCase();

export const generateId = (): string =>
  Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

export const getDeviceId = (): string => {
  let d = localStorage.getItem('funturna_device_id');
  if (!d) { d = 'dev_' + generateId(); localStorage.setItem('funturna_device_id', d); }
  return d;
};

// Read user doc with timeout
export const readUserDoc = async (uid: string, fallbackEmail?: string): Promise<any | null> => {
  try {
    const snap = await withTimeout(getDoc(doc(db, 'users', uid)), 8000, 'ReadUser');
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      id: uid,
      email: d.email || fallbackEmail || '',
      phone: d.phone || '',
      ffUid: d.ffUid || '',
      ffName: d.ffName || '',
      nickname: d.nickname || '',
      referralCode: d.referralCode || '',
      referredBy: d.referredBy || null,
      coins: d.coins ?? 0,
      diamonds: d.diamonds ?? 0,
      matchesPlayed: d.matchesPlayed ?? 0,
      wins: d.wins ?? 0,
      referralEarnings: d.referralEarnings ?? 0,
      referrals: d.referrals || [],
      joinedTournaments: d.joinedTournaments || [],
      createdAt: d.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      isBanned: d.isBanned || false,
      role: d.role || 'user',
      deviceId: d.deviceId || '',
    };
  } catch (err) {
    console.error('readUserDoc error:', err);
    return null;
  }
};

// Firestore write with timeout
export const safeSetDoc = async (ref: any, data: any) => {
  try { await withTimeout(setDoc(ref, data), 8000, 'SetDoc'); } 
  catch (e) { console.error('safeSetDoc failed:', e); }
};

export const safeUpdateDoc = async (ref: any, data: any) => {
  try { await withTimeout(updateDoc(ref, data), 8000, 'UpdateDoc'); } 
  catch (e) { console.error('safeUpdateDoc failed:', e); }
};

export {
  doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot,
  serverTimestamp, increment, arrayUnion, Timestamp, onAuthStateChanged,
  withTimeout
};
export type { FirebaseUser };
