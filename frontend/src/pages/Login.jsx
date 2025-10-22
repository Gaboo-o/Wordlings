import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    try {
      const data = await login(username, password);
      // if backend suggests redirect path, use it; else go home
      const redirect = data.redirect || '/';
      navigate(redirect);
    } catch (error) {
      setErr(error.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <h2>Login</h2>
      {err && <div style={{ color: 'red' }}>{err}</div>}
      <form onSubmit={submit} style={{ display: 'grid', gap: 8 }}>
        <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
