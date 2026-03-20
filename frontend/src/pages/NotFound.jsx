import { useNavigate } from 'react-router-dom';

import GalaxyShell from '../components/layout/GalaxyShell';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <GalaxyShell>
      <div className="centered">
        <div className="app-card">
          <h2>Page not found</h2>
          <p className="muted">That route doesn’t exist.</p>
          <button className="app-button" type="button" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </div>
      </div>
    </GalaxyShell>
  );
}