const API_BASE = import.meta.env.VITE_API_URL || 'https://funturna-backend.onrender.com';
const TOKEN_KEY = 'funturna_token';

const getToken = () => typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
const setToken = (token: string) => {
  if (typeof window !== 'undefined') localStorage.setItem(TOKEN_KEY, token);
};
const clearToken = () => {
  if (typeof window !== 'undefined') localStorage.removeItem(TOKEN_KEY);
};

const buildHeaders = (headers: Record<string, string> = {}) => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const parseJson = async (res: Response) => {
  const text = await res.text();
  try { return text ? JSON.parse(text) : null; } catch { return text; }
};

const request = async <T = any>(path: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: buildHeaders(options.headers ? options.headers as Record<string, string> : {}),
  });
  const data = await parseJson(response);
  if (!response.ok) {
    const message = data?.message || data?.error || response.statusText || 'Request failed';
    throw new Error(message);
  }
  return data as T;
};

export const withTimeout = async <T>(promise: Promise<T>, ms = 10000, label = 'Operation'): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} timed out (${ms}ms)`)), ms)),
  ]);
};

export const getDeviceId = (): string => {
  if (typeof window === 'undefined') return 'server_device';
  let id = localStorage.getItem('funturna_device_id');
  if (!id) {
    id = 'dev_' + generateId();
    localStorage.setItem('funturna_device_id', id);
  }
  return id;
};

export const generateId = (): string =>
  Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

export const generateReferralCode = (nickname: string): string =>
  nickname.substring(0, 3).toUpperCase() + Math.random().toString(36).substring(2, 7).toUpperCase();

export const signInWithGoogle = async () => {
  if (typeof window === 'undefined') {
    throw new Error('Google login requires a browser.');
  }
  const callbackUrl = window.location.origin;
  window.location.href = `${API_BASE}/auth/google?redirect=${encodeURIComponent(callbackUrl)}`;
  return { success: true };
};

export const signInWithEmail = async (email: string, password: string) => {
  const body = await request<{ token: string; user: any }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (body?.token) setToken(body.token);
  return body;
};

export const signUpWithEmail = async (data: { email: string; password: string; phone: string; ffUid: string; ffName: string; nickname: string; referredBy?: string; }) => {
  const body = await request<{ token: string; user: any }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (body?.token) setToken(body.token);
  return body;
};

export const logOut = async () => {
  try {
    await request('/auth/logout', { method: 'POST' });
  } catch {
    // ignore
  }
  clearToken();
};

export const sendVerifyEmail = async (user: { email: string }) => {
  return request('/auth/send-verification', {
    method: 'POST',
    body: JSON.stringify({ email: user.email }),
  });
};

export const sendResetPassword = async (email: string) => {
  return request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
};

export const getCurrentUser = async () => request<any>('/auth/me');
export const fetchUsers = async () => request<any[]>('/users');
export const fetchTournaments = async () => request<any[]>('/tournaments');
export const fetchTransactions = async () => request<any[]>('/transactions');
export const fetchNotifications = async () => request<any[]>('/notifications');
export const fetchCommunityPosts = async () => request<any[]>('/community');
export const fetchWithdrawRequests = async () => request<any[]>('/withdraw-requests');
export const fetchDepositRequests = async () => request<any[]>('/deposit-requests');

export const updateUserProfile = async (id: string, data: any) =>
  request<any>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const completeUserProfile = updateUserProfile;

export const createTournament = async (data: any) =>
  request<any>('/tournaments', { method: 'POST', body: JSON.stringify(data) });

export const editTournament = async (id: string, data: any) =>
  request<any>(`/tournaments/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteTournament = async (id: string) =>
  request<any>(`/tournaments/${id}`, { method: 'DELETE' });

export const joinTournament = async (id: string, teammates: string[]) =>
  request<any>(`/tournaments/${id}/join`, { method: 'POST', body: JSON.stringify({ teammates }) });

export const setRoomDetails = async (id: string, roomId: string, password: string) =>
  request<any>(`/tournaments/${id}/room`, { method: 'POST', body: JSON.stringify({ roomId, password }) });

export const publishResults = async (id: string, results: any[]) =>
  request<any>(`/tournaments/${id}/results`, { method: 'POST', body: JSON.stringify({ results }) });

export const processDeposit = async (amount: number, paymentId: string) =>
  request<any>('/deposits', { method: 'POST', body: JSON.stringify({ amount, paymentId }) });

export const requestWithdrawal = async (amount: number, upiId: string) =>
  request<any>('/withdrawals', { method: 'POST', body: JSON.stringify({ amount, upiId }) });

export const approveDeposit = async (id: string) =>
  request<any>(`/deposits/${id}/approve`, { method: 'POST' });

export const rejectDeposit = async (id: string) =>
  request<any>(`/deposits/${id}/reject`, { method: 'POST' });

export const approveWithdrawal = async (id: string) =>
  request<any>(`/withdrawals/${id}/approve`, { method: 'POST' });

export const rejectWithdrawal = async (id: string) =>
  request<any>(`/withdrawals/${id}/reject`, { method: 'POST' });

export const sendGlobalNotification = async (title: string, message: string, type: string) =>
  request<any>('/notifications', { method: 'POST', body: JSON.stringify({ title, message, type }) });

export const createCommunityPost = async (type: 'text' | 'image' | 'video', content: string, mediaUrl?: string) =>
  request<any>('/community', { method: 'POST', body: JSON.stringify({ type, content, mediaUrl }) });

export const deleteCommunityPost = async (postId: string) =>
  request<any>(`/community/${postId}`, { method: 'DELETE' });
