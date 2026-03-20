import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { fetchWords, searchWords } from '../api/words';
import { getErrorMessage } from '../api/errors';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

import GalaxyShell from '../components/layout/GalaxyShell';
import MeteorField from '../components/galaxy/MeteorField';
import OrbitActionMenu from '../components/galaxy/OrbitActionMenu';

import useDebouncedValue from '../hooks/useDebouncedValue';
import { GALAXY_CONFIG } from '../config/galaxyConfig';
import { ListIcon, LogoutIcon, PlusIcon, ShieldIcon } from '../components/ui/Icons';

/*
  Home
  Main dictionary page.

  Requirements:
  - Center the title + tagline + search bar (hero layout).
  - Keep meteors only on the Home page.
  - Provide actions through a bottom-right orbit menu (planet + moons).

  Notes:
  - Sorting is intentionally excluded.
  - This version prioritizes simplicity and visual consistency.
*/
export default function Home() {
  const [words, setWords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { themeId, cycleTheme } = useTheme();

  const isLoggedIn = !!user;
  const isAdmin = !!user?.is_admin;

  // Debounce API-driven search so we don't fire a request on every keystroke.
  const debouncedSearch = useDebouncedValue(searchTerm, GALAXY_CONFIG.SEARCH_DELAY_MS);

  /*
    loadWords
    Loads either a full list of words or a search result set.
  */
  const loadWords = useCallback(async (signal) => {
    setLoading(true);
    setError('');

    try {
      const q = debouncedSearch.trim();
      const data = q ? await searchWords(q, { signal }) : await fetchWords({}, { signal });
      setWords(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err?.code === 'CANCELED') return;
      console.error('Failed to load words:', err);
      setWords([]);
      setError(getErrorMessage(err, 'Failed to load words'));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    const controller = new AbortController();
    loadWords(controller.signal);
    return () => controller.abort();
  }, [debouncedSearch, loadWords]);

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

  const emptyState = useMemo(() => {
    if (loading) return null;
    if (error) return null;

    const q = searchTerm.trim();
    if (!words.length && q) {
      return <p className="muted home-loading">No matches for “{q}”.</p>;
    }
    if (!words.length) {
      return <p className="muted home-loading">No words yet. Add one!</p>;
    }
    return null;
  }, [loading, error, words.length, searchTerm]);

  /*
    menuItems
    Defines the orbit menu's actions. Items are filtered by the menu component via `show`.
  */
  const iconSize = GALAXY_CONFIG.ORBIT_MENU_ICON_SIZE_PX;

  const menuItems = [
    {
      key: 'add',
      label: 'Add',
      icon: <PlusIcon size={iconSize} />,
      show: true,
      onClick: () => {
        navigate(isLoggedIn ? '/add' : '/login');
      },
    },
    {
      key: 'submissions',
      label: 'Submissions',
      icon: <ListIcon size={iconSize} />,
      show: isLoggedIn,
      onClick: () => navigate('/submissions'),
    },
    {
      key: 'admin',
      label: 'Admin',
      icon: <ShieldIcon size={iconSize} />,
      show: isAdmin,
      onClick: () => navigate('/admin'),
    },
    {
      key: 'logout',
      label: 'Logout',
      icon: <LogoutIcon size={iconSize} />,
      show: isLoggedIn,
      onClick: handleLogout,
    },
    {
      key: 'theme',
      label: `Theme: ${themeId}`,
      icon: <span aria-hidden="true" style={{ fontWeight: 900, fontSize: iconSize }}>
        🎃
      </span>,
      show: true,
      onClick: () => cycleTheme(),
    },
  ];

  return (
    <GalaxyShell variant="default">
      <MeteorField words={words} query={searchTerm} />

      <div className="galaxy-ui">
        <div className="home-page">
          <section className="home-hero">
            <div className="home-hero-inner">
              <h1 className="home-title">{GALAXY_CONFIG.HOME_APP_NAME}</h1>
              <p className="home-tagline">{GALAXY_CONFIG.HOME_TAGLINE}</p>

              <form className="home-search" onSubmit={(e) => e.preventDefault()}>
                <input
                  className="app-input home-search-input"
                  placeholder={GALAXY_CONFIG.HOME_SEARCH_PLACEHOLDER}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Search words"
                />
              </form>

              {loading ? <p className="muted home-loading">Loading…</p> : null}
              {error ? <p className="error-text home-loading">{error}</p> : null}
              {emptyState}
            </div>
          </section>
        </div>
      </div>

      <OrbitActionMenu items={menuItems} />
    </GalaxyShell>
  );
}