import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';

// ── Axios instance ─────────────────────────────────────────────────────────
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Attach JWT on every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('sv_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// ── Context ────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true); // checking stored session

  // Restore session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('sv_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  // ── Register ──────────────────────────────────────────────────────────
  const register = useCallback(async (username, email, password) => {
    const { data } = await api.post('/auth/register', { username, email, password });
    localStorage.setItem('sv_token', data.token);
    localStorage.setItem('sv_user',  JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.requireOtp) {
      return data; // Requires OTP step, do not set user yet
    }
    localStorage.setItem('sv_token', data.token);
    localStorage.setItem('sv_user',  JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }, []);

  // ── Verify OTP ────────────────────────────────────────────────────────
  const verifyOtp = useCallback(async (email, otp) => {
    const { data } = await api.post('/auth/login/otp', { email, otp });
    localStorage.setItem('sv_token', data.token);
    localStorage.setItem('sv_user',  JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('sv_token');
    localStorage.removeItem('sv_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, register, login, verifyOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
