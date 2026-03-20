import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import GalaxyShell from '../layout/GalaxyShell';

export default function RequireAdmin() {
  const { user, initializing } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (initializing) {
    return (
      <GalaxyShell variant="auth">
        <div className="centered">
          <div className="app-card">
            <h2>Loading…</h2>
            <p className="muted">Checking your permissions.</p>
          </div>
        </div>
      </GalaxyShell>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!user?.is_admin) {
    return (
      <GalaxyShell>
        <div className="centered">
          <div className="app-card">
            <h2>Admin</h2>
            <p className="muted">You don’t have permission to view this page.</p>
            <button className="app-button" type="button" onClick={() => navigate('/')}>
              Back to Home
            </button>
          </div>
        </div>
      </GalaxyShell>
    );
  }

  return <Outlet />;
}