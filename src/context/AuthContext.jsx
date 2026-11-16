import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Lock, KeyRound, X, ShieldCheck } from 'lucide-react';

const API_BASE = 'http://localhost:5000';
const SESSION_UNLOCK_KEY = 'abodeX_host_unlocked_until';
const HOST_SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes session cache

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('abodeX_token') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Modal state when Guest -> Host requires password/passkey (asked once per session)
  const [hostModalOpen, setHostModalOpen] = useState(false);
  const [hostPasskey, setHostPasskey] = useState('');
  const [hostModalError, setHostModalError] = useState('');
  const [verifyingHost, setVerifyingHost] = useState(false);
  const [onHostUnlockSuccess, setOnHostUnlockSuccess] = useState(null);

  const isHostSessionUnlocked = useCallback(() => {
    const expiry = Number(sessionStorage.getItem(SESSION_UNLOCK_KEY) || 0);
    return Date.now() < expiry;
  }, []);

  // Always fetch User & Bookings from PostgreSQL (Single Source of Truth)
  const refreshUser = useCallback(
    async (authToken = token) => {
      try {
        setLoadingAuth(true);
        const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
        const res = await axios.get(`${API_BASE}/api/auth/me`, { headers });
        if (res.data?.user) {
          setUser(res.data.user);
        }
      } catch (e) {
        console.error('Failed to load user from PostgreSQL:', e);
      } finally {
        setLoadingAuth(false);
      }
    },
    [token]
  );

  useEffect(() => {
    refreshUser(token);

    const handleFocus = () => refreshUser(token);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [token, refreshUser]);

  const login = async (email, password) => {
    try {
      setLoadingAuth(true);
      const res = await axios.post(`${API_BASE}/api/auth/login`, { email, password });
      if (res.data?.token) {
        localStorage.setItem('abodeX_token', res.data.token);
        setToken(res.data.token);
      }
      if (res.data?.user) {
        setUser(res.data.user);
      }
      setIsAuthenticated(true);
      return { success: true, user: res.data?.user };
    } catch (e) {
      return {
        success: false,
        error: e.response?.data?.error || 'Invalid credentials',
      };
    } finally {
      setLoadingAuth(false);
    }
  };

  const register = async ({ name, email, password }) => {
    try {
      setLoadingAuth(true);
      const res = await axios.post(`${API_BASE}/api/auth/register`, {
        name,
        email,
        password,
      });
      if (res.data?.token) {
        localStorage.setItem('abodeX_token', res.data.token);
        setToken(res.data.token);
      }
      if (res.data?.user) {
        setUser(res.data.user);
      }
      setIsAuthenticated(true);
      return { success: true, user: res.data?.user };
    } catch (e) {
      return {
        success: false,
        error: e.response?.data?.error || 'Registration failed',
      };
    } finally {
      setLoadingAuth(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('abodeX_token');
    sessionStorage.removeItem(SESSION_UNLOCK_KEY);
    setToken('');
    setIsAuthenticated(false);
  };

  // Switch between GUEST and HOST mode on the same account
  // - HOST -> GUEST: instant, no password needed
  // - GUEST -> HOST: asks password/passkey once per session (30 min window), then instant
  const switchUserMode = async (targetMode, callbackAfterUnlock = null) => {
    if (user?.role === 'ADMIN') return true; // Admin already has full authority

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    // 1. Switching Host -> Guest is always instant without password
    if (targetMode === 'GUEST') {
      try {
        const res = await axios.post(
          `${API_BASE}/api/auth/switch-mode`,
          { targetMode: 'GUEST' },
          { headers }
        );
        if (res.data?.token) {
          localStorage.setItem('abodeX_token', res.data.token);
          setToken(res.data.token);
        }
        if (res.data?.user) setUser(res.data.user);
        return true;
      } catch (e) {
        console.error('Switch to Guest error:', e);
        return false;
      }
    }

    // 2. Switching Guest -> Host: check if already unlocked in this session
    if (targetMode === 'HOST') {
      if (isHostSessionUnlocked()) {
        try {
          const res = await axios.post(
            `${API_BASE}/api/auth/switch-mode`,
            { targetMode: 'HOST', sessionUnlocked: true },
            { headers }
          );
          if (res.data?.token) {
            localStorage.setItem('abodeX_token', res.data.token);
            setToken(res.data.token);
          }
          if (res.data?.user) setUser(res.data.user);
          if (callbackAfterUnlock) callbackAfterUnlock();
          return true;
        } catch {
          // Fall through to modal if token needs re-verification
        }
      }

      // Open Host Passkey Verification Modal (asked once per session)
      setHostPasskey('');
      setHostModalError('');
      setOnHostUnlockSuccess(() => callbackAfterUnlock);
      setHostModalOpen(true);
      return false;
    }

    return false;
  };

  const handleConfirmHostPasskey = async (e) => {
    e.preventDefault();
    try {
      setVerifyingHost(true);
      setHostModalError('');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post(
        `${API_BASE}/api/auth/switch-mode`,
        {
          targetMode: 'HOST',
          passkey: hostPasskey,
          sessionUnlocked: false,
        },
        { headers }
      );

      // Cache unlock in sessionStorage for 30 minutes so password is only asked once!
      sessionStorage.setItem(
        SESSION_UNLOCK_KEY,
        String(Date.now() + HOST_SESSION_DURATION_MS)
      );

      if (res.data?.token) {
        localStorage.setItem('abodeX_token', res.data.token);
        setToken(res.data.token);
      }
      if (res.data?.user) {
        setUser(res.data.user);
      }
      setHostModalOpen(false);
      if (onHostUnlockSuccess) onHostUnlockSuccess();
    } catch (err) {
      setHostModalError(
        err.response?.data?.error ||
          'Incorrect passkey. Enter your password (password123) or Host key (HOST2026).'
      );
    } finally {
      setVerifyingHost(false);
    }
  };

  const updateProfile = async (updatedFields) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.put(`${API_BASE}/api/auth/profile`, updatedFields, { headers });
      if (res.data?.user) {
        setUser(res.data.user);
        return res.data.user;
      }
    } catch (e) {
      console.error('Failed to update profile in PostgreSQL:', e);
    }
  };

  const addReservation = () => {
    refreshUser(token);
  };

  const cancelReservation = async (bookingId) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.patch(`${API_BASE}/api/bookings/${bookingId}/cancel`, {}, { headers });
      await refreshUser(token);
      return true;
    } catch (e) {
      console.error('Failed to cancel booking in PostgreSQL:', e);
      return false;
    }
  };

  const deleteReservation = async (bookingId) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.delete(`${API_BASE}/api/bookings/${bookingId}`, { headers });
      await refreshUser(token);
      return true;
    } catch (e) {
      console.error('Failed to delete booking in PostgreSQL:', e);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loadingAuth,
        login,
        register,
        logout,
        switchUserMode,
        isHostSessionUnlocked,
        updateProfile,
        addReservation,
        cancelReservation,
        deleteReservation,
        refreshUser,
      }}
    >
      {children}

      {/* Global Host Passkey Verification Modal (Asked Only Once Per Session) */}
      {hostModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-modal border border-borderLight space-y-5 relative">
            <button
              type="button"
              onClick={() => setHostModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-secondary hover:text-dark"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-dark">Unlock Host Mode</h3>
                <p className="text-xs text-secondary">
                  Verify once per session to create, edit, or delete property listings
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmHostPasskey} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-dark mb-1.5">
                  Account Password or Host Key
                </label>
                <div className="relative">
                  <input
                    type="password"
                    autoFocus
                    required
                    placeholder="Enter password123 or HOST2026"
                    value={hostPasskey}
                    onChange={(e) => setHostPasskey(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-borderLight text-sm text-dark focus:border-dark focus:outline-none font-medium"
                  />
                  <Lock className="w-4 h-4 text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[11px] text-secondary mt-1.5">
                  Demo passkey: <code className="font-mono font-bold text-dark">password123</code> or{' '}
                  <code className="font-mono font-bold text-dark">HOST2026</code>. Switching back to
                  Guest mode requires no password.
                </p>
              </div>

              {hostModalError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-600">
                  {hostModalError}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 gap-3">
                <button
                  type="button"
                  onClick={() => setHostModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-secondary hover:text-dark"
                >
                  Stay in Guest Mode
                </button>
                <button
                  type="submit"
                  disabled={verifyingHost}
                  className="px-6 py-2.5 bg-dark hover:bg-black text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-airbnb" />
                  <span>{verifyingHost ? 'Verifying...' : 'Unlock Host Mode'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
