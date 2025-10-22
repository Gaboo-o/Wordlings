import { useEffect, useState } from 'react';
import * as adminApi from '../api/admin';

export default function Admin() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getPending();
      setPending(data || []);
    } catch (e) {
      setPending([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (id) => {
    await adminApi.approve(id);
    load();
  };

  const reject = async (id) => {
    await adminApi.reject(id);
    load();
  };

  if (loading) return <p>Loading...</p>;
  if (!pending.length) return <p>No pending submissions.</p>;

  return (
    <div>
      <h2>Pending Submissions</h2>
      {pending.map(w => (
        <div key={w.id} style={{ border: '1px solid #ddd', padding: 12, marginBottom: 10 }}>
          <strong>{w.word}</strong>
          <p>{w.definition}</p>
          <p><em>Submitted by: </em>{w.submitted_by}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => approve(w.id)}>Approve</button>
            <button onClick={() => reject(w.id)}>Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}
