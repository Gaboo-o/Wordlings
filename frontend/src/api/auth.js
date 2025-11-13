export const login = async (username, password) => {
  const res = await axios.post(
    '/api/auth/login',
    { username, password },
    { withCredentials: true }
  );
  return res.data;
};

export const signup = async (username, password) => {
  const res = await axios.post(
    '/api/auth/signup',
    { username, password }
  );
  console.log("after await auth.js");
  return res.data;
};

export const logout = async () => {
  try {
    await axios.post('/api/auth/logout', {}, { withCredentials: true });
  } catch (e) {}
  return { message: 'logged out' };
};
