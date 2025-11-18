import axios from 'axios';
import { csrfHeader } from './_csrf';

export const login = async (username, password) =>
  (await axios.post('/api/auth/login', { username, password }, { withCredentials: true, headers: csrfHeader() })).data;

export const signup = async (username, password) =>
  (await axios.post('/api/auth/signup', { username, password }, { withCredentials: true, headers: csrfHeader() })).data;

export const logout = async () => {
  try { await axios.post('/api/auth/logout', {}, { withCredentials: true, headers: csrfHeader() }); } catch {}
  return { message: 'logged out' };
};