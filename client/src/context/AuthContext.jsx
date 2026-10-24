import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth';

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

  // Refresh the stored user from the server on load; drop the session if the token is no longer valid.
  useEffect(() => {
    if (!storage.get('token')) return;
    authApi
      .getProfile()
      .then(saveUser)
      .catch((err) => {
        if (err.response?.status === 401) logout();
      })
      .finally(() => setLoading(false));
  }, [saveUser, logout]);

  const startSession = useCallback(
    ({ token, user: nextUser }) => {
      storage.set('token', token);
      saveUser(nextUser);
      return nextUser;
    },
    [saveUser]
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
    }),
    [user, loading, startSession, logout, saveUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
