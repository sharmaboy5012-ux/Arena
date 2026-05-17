import { create } from 'zustand';
import {
  auth, db,
  signInWithGoogle, signInWithEmail, signUpWithEmail, logOut,
  generateReferralCode, generateId, getDeviceId, readUserDoc,
  safeSetDoc, safeUpdateDoc, withTimeout,
  usersRef, tournamentsRef, transactionsRef, notificationsRef,
  withdrawRequestsRef, depositRequestsRef, communityRef,
  doc, getDocs, setDoc, deleteDoc,
  query, where, orderBy, onSnapshot,
  serverTimestamp, increment, arrayUnion, Timestamp,
  onAuthStateChanged, FirebaseUser
} from '../lib/firebase';

export interface User {
  id: string; email: string; phone: string; ffUid: string; ffName: string;
  nickname: string; referralCode: string; referredBy: string | null;
  coins: number; diamonds: number; matchesPlayed: number; wins: number; referralEarnings: number;
  referrals: string[]; joinedTournaments: string[]; createdAt: string;
  isBanned: boolean; role: 'user' | 'admin'; deviceId: string;
}

export interface TeamMember { ffName: string; isOwner: boolean; }
export interface TournamentEntry { odUserId: string; ffName: string; teamMembers: TeamMember[]; joinedAt: string; }

export interface Tournament {
  id: string; banner: string; name: string; type: 'BR' | 'CS' | 'LW';
  mode: 'solo' | 'duo' | 'squad';
  entryFee: number; prizePool: number; dateTime: string; maxPlayers: number;
  joinedPlayers: string[]; entries: TournamentEntry[];
  rules: string; rewards: string; roomId: string | null; roomPassword: string | null;
  status: 'upcoming' | 'live' | 'completed'; results: TournamentResult[]; createdAt: string;
}

export interface TournamentResult { odUserId: string; position: number; reward: number; kills: number; }
export interface Transaction {
  id: string; odUserId: string;
  type: 'deposit' | 'withdrawal' | 'entry_fee' | 'reward' | 'signup_bonus' | 'referral';
  currency: 'coins' | 'diamonds' | 'mixed';
  amount: number; diamondsUsed?: number; coinsUsed?: number;
  status: 'pending' | 'completed' | 'rejected'; details: string; upiId?: string; createdAt: string;
}
export interface Notification { id: string; title: string; message: string; type: 'tournament' | 'reward' | 'system' | 'reminder'; read: boolean; createdAt: string; }
export interface CommunityPost { id: string; type: 'text' | 'image' | 'video'; content: string; mediaUrl?: string; createdAt: string; authorId: string; authorName: string; }
interface WithdrawRequest { id: string; odUserId: string; amount: number; upiId: string; status: 'pending' | 'completed' | 'rejected'; createdAt: string; }
interface DepositRequest { id: string; odUserId: string; amount: number; screenshotUploaded: boolean; status: 'pending' | 'completed' | 'rejected'; createdAt: string; paymentId?: string; }

export const getModeTeamSize = (mode: string) => mode === 'squad' ? 4 : mode === 'duo' ? 2 : 1;

interface AppState {
  currentUser: User | null; firebaseUser: FirebaseUser | null;
  users: User[]; tournaments: Tournament[]; transactions: Transaction[];
  notifications: Notification[]; communityPosts: CommunityPost[];
  withdrawRequests: WithdrawRequest[]; depositRequests: DepositRequest[];
  isAuthenticated: boolean; isLoading: boolean; currentPage: string;
  readNotifications: Set<string>;
  initialize: () => void;
  handleAuthUser: (fbUser: FirebaseUser) => Promise<void>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerWithEmail: (data: { email: string; password: string; phone: string; ffUid: string; ffName: string; nickname: string; referredBy?: string; }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  setCurrentPage: (page: string) => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  banUser: (uid: string) => Promise<void>;
  unbanUser: (uid: string) => Promise<void>;
  editUserCoins: (uid: string, coins: number) => Promise<void>;
  editUserDiamonds: (uid: string, diamonds: number) => Promise<void>;
  createTournament: (data: Partial<Tournament>) => Promise<void>;
  editTournament: (id: string, data: Partial<Tournament>) => Promise<void>;
  deleteTournament: (id: string) => Promise<void>;
  joinTournament: (tid: string, teammates: string[]) => Promise<{ success: boolean; error?: string; diamondsUsed?: number; coinsUsed?: number }>;
  setRoomDetails: (id: string, roomId: string, password: string) => Promise<void>;
  publishResults: (id: string, results: TournamentResult[]) => Promise<void>;
  processDeposit: (amount: number, paymentId: string) => Promise<void>;
  requestWithdrawal: (amount: number, upiId: string) => Promise<{ success: boolean; error?: string }>;
  approveDeposit: (id: string) => Promise<void>;
  rejectDeposit: (id: string) => Promise<void>;
  approveWithdrawal: (id: string) => Promise<void>;
  rejectWithdrawal: (id: string) => Promise<void>;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  sendGlobalNotification: (title: string, message: string, type: Notification['type']) => Promise<void>;
  createCommunityPost: (type: 'text' | 'image' | 'video', content: string, mediaUrl?: string) => Promise<void>;
  deleteCommunityPost: (postId: string) => Promise<void>;
  loadAllData: () => Promise<void>;
}

const ADMIN_EMAIL = 'sushilasharm0123456789@gmail.com';
export const ADMIN_CREDENTIALS = { email: ADMIN_EMAIL, password: 'Funturna@2024' };
const ts2str = (v: any) => v?.toDate?.()?.toISOString?.() || (typeof v === 'string' ? v : new Date().toISOString());

export const useStore = create<AppState>((set, get) => ({
  currentUser: null, firebaseUser: null,
  users: [], tournaments: [], transactions: [], notifications: [],
  communityPosts: [], withdrawRequests: [], depositRequests: [],
  isAuthenticated: false, isLoading: true, currentPage: 'home', readNotifications: new Set(),

  handleAuthUser: async (fbUser: FirebaseUser) => {
    try {
      const deviceId = getDeviceId();
      const userData = await readUserDoc(fbUser.uid, fbUser.email || undefined);
      
      if (!userData) {
        set({ firebaseUser: fbUser, isAuthenticated: false, isLoading: false, currentPage: 'complete-profile' });
        return;
      }
      if (userData.isBanned) { await logOut(); set({ isAuthenticated: false, currentUser: null, firebaseUser: null, isLoading: false, currentPage: 'home' }); return; }
      if (userData.role !== 'admin' && userData.deviceId && userData.deviceId !== deviceId) { await logOut(); set({ isAuthenticated: false, currentUser: null, firebaseUser: null, isLoading: false, currentPage: 'device-error' }); return; }
      
      // Update device silently — don't await
      if (!userData.deviceId || userData.deviceId !== deviceId) {
        safeUpdateDoc(doc(db, 'users', fbUser.uid), { deviceId });
        userData.deviceId = deviceId;
      }

      set({ firebaseUser: fbUser, currentUser: userData as User, isAuthenticated: true, isLoading: false, currentPage: userData.role === 'admin' ? 'admin-dashboard' : 'dashboard' });
      get().loadAllData();
    } catch (err) {
      console.error('handleAuthUser error:', err);
      set({ isLoading: false, currentPage: 'home' });
    }
  },

  initialize: () => {
    // Set a hard timeout — if nothing happens in 10s, stop loading
    const loadingTimeout = setTimeout(() => {
      const { isLoading } = get();
      if (isLoading) {
        console.warn('Init timeout — forcing load complete');
        set({ isLoading: false });
      }
    }, 10000);

    onAuthStateChanged(auth, async (fb) => {
      clearTimeout(loadingTimeout);
      if (get().isAuthenticated) return;
      if (fb) {
        await get().handleAuthUser(fb);
      } else {
        set({ firebaseUser: null, currentUser: null, isAuthenticated: false, isLoading: false });
      }
    });

    // Real-time listeners — wrapped in try/catch
    try { onSnapshot(query(tournamentsRef, orderBy('dateTime', 'asc')), (s) => { const a: Tournament[] = []; s.forEach((d) => { const x = d.data(); a.push({ ...x, id: d.id, mode: x.mode || 'solo', entries: x.entries || [], dateTime: ts2str(x.dateTime), createdAt: ts2str(x.createdAt) } as Tournament); }); set({ tournaments: a }); }, () => {}); } catch (_) {}
    try { onSnapshot(query(notificationsRef, orderBy('createdAt', 'desc')), (s) => { const a: Notification[] = []; const rs = get().readNotifications; s.forEach((d) => { const x = d.data(); a.push({ ...x, id: d.id, read: rs.has(d.id), createdAt: ts2str(x.createdAt) } as Notification); }); set({ notifications: a }); }, () => {}); } catch (_) {}
    try { onSnapshot(query(communityRef, orderBy('createdAt', 'desc')), (s) => { const a: CommunityPost[] = []; s.forEach((d) => { const x = d.data(); a.push({ ...x, id: d.id, createdAt: ts2str(x.createdAt) } as CommunityPost); }); set({ communityPosts: a }); }, () => {}); } catch (_) {}
  },

  loadAllData: async () => {
    try {
      const [uS, tS, wS, dS] = await Promise.all([
        withTimeout(getDocs(usersRef), 8000, 'Users').catch(() => null),
        withTimeout(getDocs(query(transactionsRef, orderBy('createdAt', 'desc'))), 8000, 'Txns').catch(() => null),
        withTimeout(getDocs(query(withdrawRequestsRef, orderBy('createdAt', 'desc'))), 8000, 'Withdraws').catch(() => null),
        withTimeout(getDocs(query(depositRequestsRef, orderBy('createdAt', 'desc'))), 8000, 'Deposits').catch(() => null),
      ]);
      const users: User[] = []; uS?.forEach((d: any) => { const x = d.data(); users.push({ ...x, id: d.id, diamonds: x.diamonds ?? 0, createdAt: ts2str(x.createdAt) } as User); });
      const transactions: Transaction[] = []; tS?.forEach((d: any) => { const x = d.data(); transactions.push({ ...x, id: d.id, currency: x.currency || 'coins', createdAt: ts2str(x.createdAt) } as Transaction); });
      const withdrawRequests: WithdrawRequest[] = []; wS?.forEach((d: any) => { const x = d.data(); withdrawRequests.push({ ...x, id: d.id, createdAt: ts2str(x.createdAt) } as WithdrawRequest); });
      const depositRequests: DepositRequest[] = []; dS?.forEach((d: any) => { const x = d.data(); depositRequests.push({ ...x, id: d.id, createdAt: ts2str(x.createdAt) } as DepositRequest); });
      set({ users, transactions, withdrawRequests, depositRequests });
    } catch (e) { console.error('loadAllData:', e); }
  },

  loginWithGoogle: async () => {
    try { const r = await signInWithGoogle(); await get().handleAuthUser(r.user); return { success: true }; }
    catch (e: any) { console.error('Google login:', e); return { success: false, error: e.code === 'auth/popup-closed-by-user' ? 'Popup closed.' : 'Google login failed. Try again.' }; }
  },

  loginWithEmail: async (email, password) => {
    try {
      const r = await signInWithEmail(email, password);
      await get().handleAuthUser(r.user);
      return { success: true };
    } catch (e: any) {
      console.error('Login error:', e);
      const c = e.code || e.message || '';
      if (c.includes('invalid-credential') || c.includes('user-not-found') || c.includes('wrong-password')) return { success: false, error: 'Invalid email or password.' };
      if (c.includes('too-many-requests')) return { success: false, error: 'Too many attempts. Wait 1 min.' };
      if (c.includes('network')) return { success: false, error: 'No internet connection.' };
      if (c.includes('timed out')) return { success: false, error: 'Connection slow. Check internet and try again.' };
      return { success: false, error: 'Login failed: ' + (e.message || 'Unknown error') };
    }
  },

  registerWithEmail: async (data) => {
    try {
      const deviceId = getDeviceId();
      
      // Step 1: Create Firebase Auth user (with timeout)
      const r = await signUpWithEmail(data.email, data.password);
      const uid = r.user.uid;

      // Step 2: Create Firestore doc (with timeout, but don't block on failure)
      try {
        await withTimeout(
          setDoc(doc(db, 'users', uid), {
            email: data.email, phone: data.phone, ffUid: data.ffUid, ffName: data.ffName, nickname: data.nickname,
            referralCode: generateReferralCode(data.nickname), referredBy: data.referredBy || null,
            coins: 0, diamonds: 5, matchesPlayed: 0, wins: 0, referralEarnings: 0,
            referrals: [], joinedTournaments: [], createdAt: serverTimestamp(),
            isBanned: false, role: data.email === ADMIN_EMAIL ? 'admin' : 'user', deviceId,
          }),
          10000, 'CreateUser'
        );
      } catch (fsErr) {
        console.error('Firestore write failed, retrying...', fsErr);
        // Retry once
        try {
          await setDoc(doc(db, 'users', uid), {
            email: data.email, phone: data.phone, ffUid: data.ffUid, ffName: data.ffName, nickname: data.nickname,
            referralCode: generateReferralCode(data.nickname), referredBy: data.referredBy || null,
            coins: 0, diamonds: 5, matchesPlayed: 0, wins: 0, referralEarnings: 0,
            referrals: [], joinedTournaments: [], createdAt: serverTimestamp(),
            isBanned: false, role: data.email === ADMIN_EMAIL ? 'admin' : 'user', deviceId,
          });
        } catch (_) {}
      }

      // Step 3: Bonus transaction (fire and forget)
      safeSetDoc(doc(db, 'transactions', generateId()), { id: generateId(), odUserId: uid, type: 'signup_bonus', currency: 'diamonds', amount: 5, status: 'completed', details: 'Signup bonus - 5 ⛃', createdAt: serverTimestamp() });

      // Step 4: Referral (fire and forget)
      if (data.referredBy) {
        getDocs(query(usersRef, where('referralCode', '==', data.referredBy)))
          .then(rs => { if (!rs.empty) safeUpdateDoc(doc(db, 'users', rs.docs[0].id), { referrals: arrayUnion(uid) }); })
          .catch(() => {});
      }

      // Step 5: Process user
      await get().handleAuthUser(r.user);
      return { success: true };
    } catch (e: any) {
      console.error('Register error:', e);
      const c = e.code || e.message || '';
      if (c.includes('email-already-in-use')) return { success: false, error: 'Email already in use. Try logging in.' };
      if (c.includes('weak-password')) return { success: false, error: 'Password too weak (min 6 chars).' };
      if (c.includes('invalid-email')) return { success: false, error: 'Invalid email address.' };
      if (c.includes('timed out')) return { success: false, error: 'Connection slow. Check internet and try again.' };
      if (c.includes('network')) return { success: false, error: 'No internet connection.' };
      return { success: false, error: 'Registration failed: ' + (e.message || 'Unknown error') };
    }
  },

  logout: async () => { try { await logOut(); } catch (_) {} set({ currentUser: null, firebaseUser: null, isAuthenticated: false, currentPage: 'home' }); },
  setCurrentPage: (p) => set({ currentPage: p }),
  updateProfile: async (data) => { const u = get().currentUser; if (!u) return; await safeUpdateDoc(doc(db, 'users', u.id), data); set({ currentUser: { ...u, ...data } }); },
  banUser: async (uid) => { await safeUpdateDoc(doc(db, 'users', uid), { isBanned: true }); set(s => ({ users: s.users.map(u => u.id === uid ? { ...u, isBanned: true } : u) })); },
  unbanUser: async (uid) => { await safeUpdateDoc(doc(db, 'users', uid), { isBanned: false }); set(s => ({ users: s.users.map(u => u.id === uid ? { ...u, isBanned: false } : u) })); },
  editUserCoins: async (uid, coins) => { await safeUpdateDoc(doc(db, 'users', uid), { coins }); set(s => ({ users: s.users.map(u => u.id === uid ? { ...u, coins } : u) })); },
  editUserDiamonds: async (uid, diamonds) => { await safeUpdateDoc(doc(db, 'users', uid), { diamonds }); set(s => ({ users: s.users.map(u => u.id === uid ? { ...u, diamonds } : u) })); },

  createTournament: async (data) => {
    const id = generateId();
    await safeSetDoc(doc(db, 'tournaments', id), {
      id, banner: data.banner || '/images/tournament-br.jpg', name: data.name || '', type: data.type || 'BR',
      mode: data.mode || 'solo', entryFee: data.entryFee || 0, prizePool: data.prizePool || 0,
      dateTime: data.dateTime ? Timestamp.fromDate(new Date(data.dateTime)) : serverTimestamp(),
      maxPlayers: data.maxPlayers || 50, joinedPlayers: [], entries: [],
      rules: data.rules || '', rewards: data.rewards || '', roomId: null, roomPassword: null,
      status: 'upcoming', results: [], createdAt: serverTimestamp(),
    });
  },
  editTournament: async (id, data) => { const u: any = { ...data }; if (data.dateTime) u.dateTime = Timestamp.fromDate(new Date(data.dateTime)); await safeUpdateDoc(doc(db, 'tournaments', id), u); },
  deleteTournament: async (id) => { try { await deleteDoc(doc(db, 'tournaments', id)); } catch (_) {} },

  joinTournament: async (tid, teammates) => {
    const { currentUser: u, tournaments } = get();
    if (!u) return { success: false, error: 'Login first' };
    const t = tournaments.find(x => x.id === tid);
    if (!t) return { success: false, error: 'Not found' };
    if (t.joinedPlayers.includes(u.id)) return { success: false, error: 'Already joined!' };

    const teamSize = getModeTeamSize(t.mode);
    const totalFee = t.entryFee * teamSize;
    const maxTeams = Math.floor(t.maxPlayers / teamSize);
    if ((t.entries || []).length >= maxTeams) return { success: false, error: 'Tournament full!' };

    const totalBal = (u.diamonds || 0) + u.coins;
    if (totalBal < totalFee) return { success: false, error: `Need ${totalFee} (${t.entryFee}×${teamSize}). You have ${u.diamonds || 0} ⛃ + ${u.coins} 🪙 = ${totalBal}` };

    let dUsed = Math.min(u.diamonds || 0, totalFee);
    let cUsed = totalFee - dUsed;
    const newD = (u.diamonds || 0) - dUsed;
    const newC = u.coins - cUsed;
    const nm = u.matchesPlayed + 1;

    const members: TeamMember[] = [{ ffName: u.ffName, isOwner: true }];
    if (teamSize > 1) teammates.forEach(n => { if (n.trim()) members.push({ ffName: n.trim(), isOwner: false }); });
    const entry: TournamentEntry = { odUserId: u.id, ffName: u.ffName, teamMembers: members, joinedAt: new Date().toISOString() };

    await safeUpdateDoc(doc(db, 'users', u.id), { diamonds: newD, coins: newC, matchesPlayed: nm, joinedTournaments: arrayUnion(tid) });
    await safeUpdateDoc(doc(db, 'tournaments', tid), { joinedPlayers: arrayUnion(u.id), entries: arrayUnion(entry) });

    let dp: string[] = [];
    if (dUsed > 0) dp.push(`${dUsed} ⛃`);
    if (cUsed > 0) dp.push(`${cUsed} 🪙`);
    safeSetDoc(doc(db, 'transactions', generateId()), { id: generateId(), odUserId: u.id, type: 'entry_fee', currency: dUsed > 0 && cUsed > 0 ? 'mixed' : dUsed > 0 ? 'diamonds' : 'coins', amount: totalFee, diamondsUsed: dUsed, coinsUsed: cUsed, status: 'completed', details: `${t.name} [${t.mode.toUpperCase()} ×${teamSize}] (${dp.join(' + ')})`, createdAt: serverTimestamp() });

    if (nm >= 2 && u.referredBy) {
      getDocs(query(usersRef, where('referralCode', '==', u.referredBy)))
        .then(async rs => { if (!rs.empty) { const rws = await getDocs(query(transactionsRef, where('type', '==', 'referral'), where('details', '==', `Ref reward ${u.id}`))); if (rws.empty) { await safeUpdateDoc(doc(db, 'users', rs.docs[0].id), { coins: increment(10), referralEarnings: increment(10) }); safeSetDoc(doc(db, 'transactions', generateId()), { id: generateId(), odUserId: rs.docs[0].id, type: 'referral', currency: 'coins', amount: 10, status: 'completed', details: `Ref reward ${u.id}`, createdAt: serverTimestamp() }); } } })
        .catch(() => {});
    }

    set({ currentUser: { ...u, diamonds: newD, coins: newC, matchesPlayed: nm, joinedTournaments: [...u.joinedTournaments, tid] } });
    get().loadAllData();
    return { success: true, diamondsUsed: dUsed, coinsUsed: cUsed };
  },

  setRoomDetails: async (id, r, p) => { await safeUpdateDoc(doc(db, 'tournaments', id), { roomId: r, roomPassword: p }); },
  publishResults: async (id, results) => { for (const r of results) { if (r.reward > 0) { await safeUpdateDoc(doc(db, 'users', r.odUserId), { coins: increment(r.reward), wins: r.position <= 3 ? increment(1) : increment(0) }); safeSetDoc(doc(db, 'transactions', generateId()), { id: generateId(), odUserId: r.odUserId, type: 'reward', currency: 'coins', amount: r.reward, status: 'completed', details: `🏆 #${r.position}`, createdAt: serverTimestamp() }); } } await safeUpdateDoc(doc(db, 'tournaments', id), { results, status: 'completed' }); get().loadAllData(); },

  processDeposit: async (amount, paymentId) => { const u = get().currentUser; if (!u) return; await safeSetDoc(doc(db, 'depositRequests', generateId()), { id: generateId(), odUserId: u.id, amount, status: 'completed', paymentId, createdAt: serverTimestamp() }); await safeUpdateDoc(doc(db, 'users', u.id), { diamonds: increment(amount) }); safeSetDoc(doc(db, 'transactions', generateId()), { id: generateId(), odUserId: u.id, type: 'deposit', currency: 'diamonds', amount, status: 'completed', details: `₹${amount} → ${amount} ⛃`, createdAt: serverTimestamp() }); set({ currentUser: { ...u, diamonds: (u.diamonds || 0) + amount } }); get().loadAllData(); },

  requestWithdrawal: async (amount, upiId) => { const u = get().currentUser; if (!u) return { success: false, error: 'Login' }; if (u.coins < amount) return { success: false, error: `Only ${u.coins} 🪙 available.` }; if (amount < 10) return { success: false, error: 'Min ₹10' }; await safeUpdateDoc(doc(db, 'users', u.id), { coins: increment(-amount) }); await safeSetDoc(doc(db, 'withdrawRequests', generateId()), { id: generateId(), odUserId: u.id, amount, upiId, status: 'pending', createdAt: serverTimestamp() }); safeSetDoc(doc(db, 'transactions', generateId()), { id: generateId(), odUserId: u.id, type: 'withdrawal', currency: 'coins', amount, status: 'pending', details: `Withdraw ${amount} 🪙 → ${upiId}`, upiId, createdAt: serverTimestamp() }); set({ currentUser: { ...u, coins: u.coins - amount } }); get().loadAllData(); return { success: true }; },

  approveDeposit: async (rid) => { const r = get().depositRequests.find(x => x.id === rid); if (!r) return; await safeUpdateDoc(doc(db, 'depositRequests', rid), { status: 'completed' }); await safeUpdateDoc(doc(db, 'users', r.odUserId), { diamonds: increment(r.amount) }); get().loadAllData(); },
  rejectDeposit: async (rid) => { await safeUpdateDoc(doc(db, 'depositRequests', rid), { status: 'rejected' }); get().loadAllData(); },
  approveWithdrawal: async (rid) => { await safeUpdateDoc(doc(db, 'withdrawRequests', rid), { status: 'completed' }); get().loadAllData(); },
  rejectWithdrawal: async (rid) => { const r = get().withdrawRequests.find(x => x.id === rid); if (!r) return; await safeUpdateDoc(doc(db, 'users', r.odUserId), { coins: increment(r.amount) }); await safeUpdateDoc(doc(db, 'withdrawRequests', rid), { status: 'rejected' }); const u = get().currentUser; if (u?.id === r.odUserId) set({ currentUser: { ...u, coins: u.coins + r.amount } }); get().loadAllData(); },

  markNotificationRead: (id) => set(s => { const n = new Set(s.readNotifications); n.add(id); return { readNotifications: n, notifications: s.notifications.map(x => x.id === id ? { ...x, read: true } : x) }; }),
  markAllRead: () => set(s => ({ readNotifications: new Set(s.notifications.map(n => n.id)), notifications: s.notifications.map(n => ({ ...n, read: true })) })),
  sendGlobalNotification: async (title, message, type) => { await safeSetDoc(doc(db, 'notifications', generateId()), { id: generateId(), title, message, type, createdAt: serverTimestamp() }); },
  createCommunityPost: async (type, content, mediaUrl?) => { const u = get().currentUser; if (!u || u.role !== 'admin') return; await safeSetDoc(doc(db, 'community', generateId()), { id: generateId(), type, content, mediaUrl: mediaUrl || null, authorId: u.id, authorName: u.nickname, createdAt: serverTimestamp() }); },
  deleteCommunityPost: async (postId) => { try { await deleteDoc(doc(db, 'community', postId)); } catch (_) {} },
}));
