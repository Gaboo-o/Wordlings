import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import GalaxyShell from '../components/layout/GalaxyShell';
import AuthCard from '../components/layout/AuthCard';

/*
  Signup
  Account creation page wrapped in GalaxyShell.
  Uses shared AuthCard and theme styles to keep pages consistent.
*/
export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  /*
    submit
    Creates an account and redirects to the home page.
  */
  const submit = async (e) => {
    e.preventDefault();
    try {
      await signup(username, password);
      navigate('/');
    } catch (error) {
      setErr(error.response?.data?.error || 'Signup failed');
    }
  };

  const footer = (
    <div>
      Already have an account?{' '}
      <button type="button" className="link-button" onClick={() => navigate('/login')}>
        Log in
      </button>
    </div>
  );

  return (
    <GalaxyShell variant="auth">
      <div className="centered">
        <AuthCard title="Create Account" error={err} footer={footer}>
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
              Sign Up
            </button>
          </form>
        </AuthCard>
      </div>
    </GalaxyShell>
  );
}