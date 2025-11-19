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
      await login(username, password);
      navigate('/');
    } catch (error) {
      setErr(error.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div style={{
      maxWidth: 400,
      margin: '80px auto',
      padding: '2rem',
      border: '1px solid #ddd',
      borderRadius: 12,
      boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
      backgroundColor: '#fff',
      textAlign: 'center',
      fontFamily: 'sans-serif'
    }}>
      <h2 style={{ marginBottom: '1.5rem' }}>Login</h2>

      {err && <div style={{ color: 'red', marginBottom: '1rem' }}>{err}</div>}

      <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
        <input
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
          style={{
            padding: '0.6rem 0.8rem',
            borderRadius: 8,
            border: '1px solid #ccc',
            fontSize: '1rem'
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{
            padding: '0.6rem 0.8rem',
            borderRadius: 8,
            border: '1px solid #ccc',
            fontSize: '1rem'
          }}
        />
        <button
          type="submit"
          style={{
            padding: '0.7rem 0.8rem',
            borderRadius: 8,
            backgroundColor: '#007BFF',
            color: 'white',
            border: 'none',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          Login
        </button>
      </form>

      {/* Signup link */}
      <div style={{ marginTop: '1.5rem', fontSize: '0.95rem', color: '#555' }}>
        Don’t have an account?{' '}
        <button
          type="button"
          onClick={() => navigate('/signup')}
          style={{
            background: 'none',
            border: 'none',
            color: '#007BFF',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}
        >
          Sign up
        </button>
      </div>
    </div>
  );
}
