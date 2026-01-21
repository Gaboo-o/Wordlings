import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { fetchWords, searchWords } from '../api/words';
import { useAuth } from '../context/AuthContext';

import GalaxyShell from '../components/layout/GalaxyShell';
import MeteorField from '../components/galaxy/MeteorField';

/*
  Home
  Main dictionary page.

  Notes:
  - Wrapped in GalaxyShell to share the same star background as other pages.
  - Meteors are intentionally only rendered on Home.
*/
export default function Home() {
  const [words, setWords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sort, setSort] = useState('alphabetical');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isLoggedIn = !!user;
  const username = user ? user.username || 'You' : 'Guest';

  /*
    loadWords
    Loads words from the API, using either search or sorting.
  */
  const loadWords = async () => {
    setLoading(true);
    try {
      const data = searchTerm.trim()
        ? await searchWords(searchTerm)
        : await fetchWords({ sort });

      setWords(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load words:', error);
      setWords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWords();
  }, [sort, searchTerm]);

  /*
    handleLogout
    Logs the user out using AuthContext.
  */
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (e) {
      console.error('Logout failed:', e);
    }
  };

  return (
    <GalaxyShell variant="default">
      <MeteorField words={words} query={searchTerm} />

      <div className="galaxy-ui">
        <p>Welcome, {username}</p>

        {user?.is_admin ? (
          <button className="app-button" onClick={() => navigate('/admin')}>
            Admin Dashboard
          </button>
        ) : null}

        <form onSubmit={(e) => e.preventDefault()} className="home-controls">
          <input
            className="app-input"
            placeholder="Search words..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="row-wrap">
            <button className="app-button" type="button" onClick={() => navigate('/add')}>
              Add Word
            </button>

            <button className="app-button" type="button" onClick={handleLogout} disabled={!isLoggedIn}>
              Logout
            </button>
          </div>
        </form>

        {loading ? <p>Loading...</p> : null}
      </div>
    </GalaxyShell>
  );
}