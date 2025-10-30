import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import * as authApi from '../api/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    // Check current login status on mount
    (async () => {
      try {
        const res = await axios.get('/api/auth/status', { withCredentials: true });
        if (res.data.logged_in)
          setUser({ id: res.data.user_id, is_admin: res.data.is_admin });
        else
          setUser(null);
      } catch {
        setUser(null);
      }
    })();
  }, []);

  const login = async (username, password) => {
    const data = await authApi.login(username, password);
    const userObj = { id: data.user_id, is_admin: data.is_admin || false };
    localStorage.setItem('user', JSON.stringify(userObj));
    setUser(userObj);
    return data;
  };

  const signup = async (username, password) => {
    const data = await authApi.signup(username, password);
    const userObj = { id: data.user_id, is_admin: data.is_admin || false };
    localStorage.setItem('user', JSON.stringify(userObj));
    setUser(userObj);
    return data;
  };

  const logout = async () => {
    await authApi.logout();
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);