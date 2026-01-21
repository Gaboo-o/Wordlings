import { useEffect, useState } from 'react';

import * as adminApi from '../api/admin';
import GalaxyShell from '../components/layout/GalaxyShell';

/*
  Admin
  Admin dashboard page for approving or rejecting pending word submissions.
  Wrapped in GalaxyShell so it shares the same background as the rest of the app.
*/
export default function Admin() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  /*
    load
    Fetches pending submissions from the admin API.
  */
  const load = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getPending();
      setPending(data || []);
    } catch (e) {
      console.error('Failed to load pending submissions:', e);
      setPending([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /*
    approve
    Approves a submission and refreshes the list.
  */
  const approve = async (id) => {
    await adminApi.approve(id);
    load();
  };

  /*
    reject
    Rejects a submission and refreshes the list.
  */
  const reject = async (id) => {
    await adminApi.reject(id);
    load();
  };

  return (
    <GalaxyShell>
      <div className="centered">
        <div className="app-card">
          <h2>Pending Submissions</h2>

          {loading ? <p>Loading...</p> : null}

          {!loading && !pending.length ? (
            <p className="muted">No pending submissions.</p>
          ) : null}

          <div className="stack">
            {pending.map((w) => (
              <div key={w.id} className="item-card">
                <strong>{w.word}</strong>
                <p>{w.definition}</p>
                <p className="muted">Submitted by: {w.submitted_by}</p>
                <div className="row-wrap">
                  <button className="app-button" type="button" onClick={() => approve(w.id)}>
                    Approve
                  </button>
                  <button className="app-button" type="button" onClick={() => reject(w.id)}>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </GalaxyShell>
  );
}