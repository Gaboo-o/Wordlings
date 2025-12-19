import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    try {
      await signup(username, password);
      navigate('/');
    } catch (error) {
      setErr(error.response?.data?.error || 'Signup failed');
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
      <h2 style={{ marginBottom: '1.5rem' }}>Create Account</h2>

      {err && <div style={{ color: 'red', marginBottom: '1rem' }}>{err}</div>}

      <button
  type="button"
  onClick={() => window.location.href = "/api/auth/google/login"}
  style={{
    width: "100%",
    padding: "0.7rem",
    borderRadius: 8,
    border: "1px solid #ddd",
    backgroundColor: "white",
    cursor: "pointer",
    marginBottom: "1rem",
    fontSize: "0.95rem"
  }}
>
  🔐 Sign up with Google
</button>

<div style={{ margin: "1rem 0", color: "#999" }}>
  — or —
</div>


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
          Sign Up
        </button>
      </form>

      {/* Link to login */}
      <div style={{ marginTop: '1.5rem', fontSize: '0.95rem', color: '#555' }}>
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => navigate('/login')}
          style={{
            background: 'none',
            border: 'none',
            color: '#007BFF',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}
        >
          Log in
        </button>
      </div>
    </div>
  );
}
