import axios from 'axios';

export const login = async (username, password) =>
  (await axios.post('/api/auth/login', { username, password }, { withCredentials: true })).data;

export const signup = async (username, password) => {
  console.log("auth.js before await");
  const res = await axios.post('/api/auth/signup', { username, password }, { withCredentials: true });
  console.log("auth.js after await");
  return res.data;
}
export const logout = async () => {
  try { await axios.post('/api/auth/logout', {}, { withCredentials: true }); } catch {}
  return { message: 'logged out' };
};
