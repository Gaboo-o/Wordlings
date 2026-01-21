import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import GalaxyShell from '../components/layout/GalaxyShell';
import AuthCard from '../components/layout/AuthCard';

/*
  Login
  Authentication page wrapped in GalaxyShell.
  Uses shared AuthCard and theme styles to avoid duplicated inline styling.
*/
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  /*
    submit
    Attempts to log in and redirects to the home page.
  */
  const submit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate('/');
    } catch (error) {
      setErr(error.response?.data?.error || 'Login failed');
    }
  };

  const footer = (
    <div>
      Don’t have an account?{' '}
      <button type="button" className="link-button" onClick={() => navigate('/signup')}>
        Sign up
      </button>
    </div>
  );

  return (
    <GalaxyShell variant="auth">
      <div className="centered">
        <AuthCard title="Login" error={err} footer={footer}>
          <form onSubmit={submit} className="form-grid">
            <input
              className="app-input"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              className="app-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button className="app-button" type="submit">
              Login
            </button>
          </form>
        </AuthCard>
      </div>
    </GalaxyShell>
  );
}