import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import * as adminApi from '../api/admin';
import { getErrorMessage } from '../api/errors';
import GalaxyShell from '../components/layout/GalaxyShell';

/*
  Admin
  Admin dashboard page for approving or rejecting pending word submissions.
  Wrapped in GalaxyShell so it shares the same background as the rest of the app.
*/
export default function Admin() {
  const navigate = useNavigate();

  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /*
    load
    Fetches pending submissions from the admin API.
  */
  const load = async (signal) => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getPending({ signal });
      // Defensive: tolerate either an array response, or a wrapped { data: [] } shape.
      const next = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setPending(next);
    } catch (e) {
      if (e?.code === 'CANCELED') return;
      console.error('Failed to load pending submissions:', e);
      setPending([]);
      setError(getErrorMessage(e, 'Failed to load pending submissions'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, []);

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
      setError(getErrorMessage(e, 'Approve failed'));
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
      setError(getErrorMessage(e, 'Reject failed'));
    }
  };

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
                <button className="app-button" type="button" onClick={() => load()} disabled={loading}>
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
              {(Array.isArray(pending) ? pending : []).map((w) => (
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