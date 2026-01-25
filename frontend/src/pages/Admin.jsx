import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import * as adminApi from '../api/admin';
import { useAuth } from '../context/AuthContext';
import GalaxyShell from '../components/layout/GalaxyShell';

/*
  Admin
  Admin dashboard page for approving or rejecting pending word submissions.
  Wrapped in GalaxyShell so it shares the same background as the rest of the app.
*/
export default function Admin() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isLoggedIn = !!user;
  const isAdmin = !!user?.is_admin;

  /*
    load
    Fetches pending submissions from the admin API.
  */
  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getPending();
      setPending(data || []);
    } catch (e) {
      console.error('Failed to load pending submissions:', e);
      setPending([]);
      setError(e?.response?.data?.error || e?.message || 'Failed to load pending submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    load();
  }, [isAdmin]);

  /*
    approve
    Approves a submission and refreshes the list.
  */
  const approve = async (id) => {
    try {
      await adminApi.approve(id);
      load();
    } catch (e) {
      console.error('Approve failed:', e);
      setError(e?.response?.data?.error || e?.message || 'Approve failed');
    }
  };

  /*
    reject
    Rejects a submission and refreshes the list.
  */
  const reject = async (id) => {
    try {
      await adminApi.reject(id);
      load();
    } catch (e) {
      console.error('Reject failed:', e);
      setError(e?.response?.data?.error || e?.message || 'Reject failed');
    }
  };

  if (!isLoggedIn) {
    return (
      <GalaxyShell variant="auth">
        <div className="centered">
          <div className="app-card">
            <h2>Admin Dashboard</h2>
            <p className="muted">You must be logged in to access admin tools.</p>
            <div className="row-wrap">
              <button className="app-button" type="button" onClick={() => navigate('/login')}>
                Go to Login
              </button>
              <button className="app-button app-button--secondary" type="button" onClick={() => navigate('/')}>
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </GalaxyShell>
    );
  }

  if (!isAdmin) {
    return (
      <GalaxyShell>
        <div className="centered">
          <div className="app-card">
            <h2>Admin Dashboard</h2>
            <p className="muted">You do not have permission to view this page.</p>
            <button className="app-button" type="button" onClick={() => navigate('/')}>
              Back to Home
            </button>
          </div>
        </div>
      </GalaxyShell>
    );
  }

  return (
    <GalaxyShell>
      <div className="page">
        <div className="page-inner">
          <div className="app-card app-card--wide">
            <div className="page-header">
              <div>
                <h1 className="page-title">Admin Dashboard</h1>
                <div className="page-subtitle">Review and approve or reject submitted words.</div>
              </div>

              <div className="page-actions">
                <button className="app-button app-button--secondary" type="button" onClick={() => navigate('/')}>
                  Back to Home
                </button>
                <button className="app-button" type="button" onClick={load} disabled={loading}>
                  Refresh
                </button>
              </div>
            </div>

            {error ? <p className="error-text">{error}</p> : null}

            {loading ? <p>Loading...</p> : null}

            {!loading && !pending.length ? (
              <p className="muted">No pending submissions.</p>
            ) : null}

            <div className="stack">
              {pending.map((w) => (
                <div key={w.id} className="item-card">
                  <strong>{w.word}</strong>
                  {w.definition ? <p>{w.definition}</p> : null}

                  <p className="muted">
                    Submitted by: {w.submitted_by_username || w.submitted_by || 'Unknown'}
                  </p>

                  <div className="row-wrap">
                    <button className="app-button" type="button" onClick={() => approve(w.id)}>
                      Approve
                    </button>
                    <button
                      className="app-button app-button--secondary"
                      type="button"
                      onClick={() => reject(w.id)}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </GalaxyShell>
  );
}