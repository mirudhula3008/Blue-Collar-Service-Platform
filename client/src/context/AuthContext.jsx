import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as authApi from '../api/auth';
import { useLanguage } from './LanguageContext';

const AuthContext = createContext(null);

const storage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

function readStoredUser() {
  try {
    return JSON.parse(storage.get('user')) || null;
  } catch {
    return null;
  }
}

// Where each role lands after logging in.
export const homePathFor = (role) => ({ customer: '/dashboard', worker: '/worker/dashboard', admin: '/admin' })[role] || '/';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(Boolean(storage.get('token')));

  const saveUser = useCallback((next) => {
    setUser(next);
    if (next) storage.set('user', JSON.stringify(next));
    else storage.remove('user');
  }, []);

  const logout = useCallback(() => {
    storage.remove('token');
    saveUser(null);
  }, [saveUser]);

  // Language follows the account: apply the saved choice, or save the current
  // one if the account has none yet (e.g. picked Tamil before logging in).
  const { currentLanguage, changeLanguage } = useLanguage();
  const languageRef = useRef(currentLanguage);
  languageRef.current = currentLanguage;

  const syncLanguage = useCallback(
    (account) => {
      if (!account) return account;
      if (account.preferredLanguage) {
        changeLanguage(account.preferredLanguage);
        return account;
      }
      if (languageRef.current === 'en') return account;
      authApi.updateLanguage(languageRef.current).catch(() => {});
      return { ...account, preferredLanguage: languageRef.current };
    },
    [changeLanguage]
  );

  // Refresh the stored user from the server on load; drop the session if the token is no longer valid.
  useEffect(() => {
    if (!storage.get('token')) return;
    authApi
      .getProfile()
      .then((profile) => saveUser(syncLanguage(profile)))
      .catch((err) => {
        if (err.response?.status === 401) logout();
      })
      .finally(() => setLoading(false));
  }, [saveUser, logout, syncLanguage]);

  const startSession = useCallback(
    ({ token, user: nextUser }) => {
      storage.set('token', token);
      const synced = syncLanguage(nextUser);
      saveUser(synced);
      return synced;
    },
    [saveUser, syncLanguage]
  );

  // Called when a logged-in user picks a language in the navbar.
  const rememberLanguage = useCallback(
    (code) => {
      if (!user) return;
      authApi.updateLanguage(code).catch(() => {});
      saveUser({ ...user, preferredLanguage: code });
    },
    [user, saveUser]
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login: async (email, password) => startSession(await authApi.login(email, password)),
      register: async (data) => startSession(await authApi.register(data)),
      logout,
      updateUser: saveUser,
      rememberLanguage,
    }),
    [user, loading, startSession, logout, saveUser, rememberLanguage]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
