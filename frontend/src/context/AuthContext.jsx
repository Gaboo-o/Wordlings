import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import * as authApi from '../api/auth';
import { setUnauthorizedHandler } from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null;
    } catch {
      return null;
    }
  });
  const [initializing, setInitializing] = useState(true);

  const persistUser = useCallback((u) => {
    if (u) localStorage.setItem('user', JSON.stringify(u));
    else localStorage.removeItem('user');
  }, []);

  const refresh = useCallback(async ({ signal } = {}) => {
    const res = await authApi.status({ signal });
    if (res?.logged_in) {
      const u = {
        id: res.user_id,
        username: res.username,
        is_admin: !!res.is_admin,
      };
      setUser(u);
      persistUser(u);
      return u;
    }
    setUser(null);
    persistUser(null);
    return null;
  }, [persistUser]);

  useEffect(() => {
    // Keep UI in sync if the server invalidates the session.
    setUnauthorizedHandler(() => {
      setUser(null);
      persistUser(null);
    });
  }, [persistUser]);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        await refresh({ signal: controller.signal });
      } catch {
        // If we cannot verify status, fail closed (treat as logged out).
        setUser(null);
        persistUser(null);
      } finally {
        setInitializing(false);
      }
    })();

    return () => controller.abort();
  }, [refresh]);

  const login = useCallback(async (username, password) => {
    const data = await authApi.login(username, password);
    const u = {
      id: data.user_id,
      username: data.username,
      is_admin: !!data.is_admin,
    };
    setUser(u);
    persistUser(u);
    return data;
  }, [persistUser]);

  const signup = useCallback(async (username, password) => {
    const data = await authApi.signup(username, password);
    const u = {
      id: data.user_id,
      username: data.username,
      is_admin: !!data.is_admin,
    };
    setUser(u);
    persistUser(u);
    return data;
  }, [persistUser]);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    persistUser(null);
  }, [persistUser]);

  const value = useMemo(
    () => ({ user, initializing, login, signup, logout, refresh }),
    [user, initializing, login, signup, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);