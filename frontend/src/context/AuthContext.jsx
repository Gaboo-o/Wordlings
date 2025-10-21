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
    // attach token (if present) to axios
    const token = localStorage.getItem('token');
    if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }, []);

  const login = async (username, password) => {
    const data = await authApi.login(username, password);
    // backend may or may not return a token. We'll handle both:
    if (data.token) {
      localStorage.setItem('token', data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    }
    // store user object if returned, else minimal
    const userObj = data.user || { username, is_admin: data.is_admin || false };
    localStorage.setItem('user', JSON.stringify(userObj));
    setUser(userObj);
    return data;
  };

  const signup = async (username, password) => {
    const data = await authApi.signup(username, password);
    if (data.token) {
      localStorage.setItem('token', data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    }
    const userObj = data.user || { username, is_admin: data.is_admin || false };
    localStorage.setItem('user', JSON.stringify(userObj));
    setUser(userObj);
    return data;
  };

  const logout = async () => {
    await authApi.logout();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
