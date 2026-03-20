import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import GalaxyShell from '../layout/GalaxyShell';

export default function RequireAuth() {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <GalaxyShell variant="auth">
        <div className="centered">
          <div className="app-card">
            <h2>Loading…</h2>
            <p className="muted">Checking your session.</p>
          </div>
        </div>
      </GalaxyShell>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}