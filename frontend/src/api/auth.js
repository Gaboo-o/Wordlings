import axios from 'axios';

export const login = async (username, password) => {
  const res = await axios.post('/api/auth/login', { username, password });
  // backend may return { redirect: "...", ... } - keep whole payload
  return res.data;
};

export const signup = async (username, password) => {
  const res = await axios.post('/api/auth/signup', { username, password });
  return res.data;
};

export const logout = async () => {
  // backend logout endpoint (POST)
  try {
    await axios.post('/api/auth/logout');
  } catch (e) {
    // ignore network errors
  }
  return { message: 'logged out' };
};
