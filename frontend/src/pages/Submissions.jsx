import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import * as wordsApi from '../api/words';
import { getErrorMessage } from '../api/errors';
import GalaxyShell from '../components/layout/GalaxyShell';

/*
  Submissions
  Shows the logged-in user's submitted words and their review status.

  Notes:
  - Uses GalaxyShell for consistent background and layout.
  - Does not render meteors.
*/
export default function Submissions() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /*
    statusVariant
    Maps a backend status string to a CSS modifier class.
  */
  const statusVariant = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'approved') return 'status-pill--approved';
    if (s === 'rejected') return 'status-pill--rejected';
    return 'status-pill--pending';
  };

  /*
    load
    Fetches the current user's submissions.

    This expects an API function named fetchMySubmissions().
    If your API uses a different endpoint/name, update ../api/words accordingly.
  */
  const load = async (signal) => {
    setLoading(true);
    setError('');
    try {
      const data = await wordsApi.fetchSubmissions({ signal });
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      if (e?.code === 'CANCELED') return;
      console.error('Failed to load submissions:', e);
      setItems([]);
      setError(getErrorMessage(e, 'Failed to load submissions'));
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
    sorted
    Keeps pending submissions near the top for readability.
  */
  const sorted = useMemo(() => {
    const rank = (status) => {
      const s = String(status || '').toLowerCase();
      if (s === 'pending') return 0;
      if (s === 'approved') return 1;
      if (s === 'rejected') return 2;
      return 3;
    };

    return [...items].sort((a, b) => rank(a.status) - rank(b.status));
  }, [items]);

  return (
    <GalaxyShell>
      <div className="page">
        <div className="page-inner">
          <div className="app-card app-card--wide">
            <div className="page-header">
              <div>
                <h1 className="page-title">My Submissions</h1>
                <div className="page-subtitle">Track approval status for words you submitted.</div>
              </div>

              <div className="page-actions">
                <button className="app-button app-button--secondary" type="button" onClick={() => navigate('/add')}>
                  Submit a Word
                </button>
                <button className="app-button" type="button" onClick={() => load()} disabled={loading}>
                  Refresh
                </button>
              </div>
            </div>

            {error ? <p className="error-text">{error}</p> : null}
            {loading ? <p>Loading...</p> : null}

            {!loading && !sorted.length ? (
              <p className="muted">No submissions yet.</p>
            ) : null}

            <div className="stack">
              {sorted.map((s) => {
                const statusText = String(s.status || 'pending');
                const canView = String(s.status || '').toLowerCase() === 'approved';

                return (
                  <div key={s.id} className="item-card">
                    <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
                      <strong>{s.word}</strong>
                      <span className={`status-pill ${statusVariant(s.status)}`}>{statusText}</span>
                    </div>

                    {s.definition ? <p>{s.definition}</p> : null}
                    {s.examples ? (
                      <p className="muted" style={{ marginTop: 0 }}>
                        Examples: {s.examples}
                      </p>
                    ) : null}

                    <div className="row-wrap">
                      {canView ? (
                        <button
                          className="app-button"
                          type="button"
                          onClick={() => navigate(`/word/${s.id}`)}
                        >
                          View Word
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </GalaxyShell>
  );
}