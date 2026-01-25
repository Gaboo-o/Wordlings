import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { fetchWords, searchWords, upvoteWord } from '../api/words';
import { useAuth } from '../context/AuthContext';

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

  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isLoggedIn = !!user;
  const isAdmin = !!user?.is_admin;

  // Debounce API-driven search so we don't fire a request on every keystroke.
  const debouncedSearch = useDebouncedValue(searchTerm, GALAXY_CONFIG.SEARCH_DELAY_MS);

  /*
    loadWords
    Loads either a full list of words or a search result set.
  */
  const loadWords = async () => {
    setLoading(true);

    try {
      const q = debouncedSearch.trim();
      const data = q ? await searchWords(q) : await fetchWords();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  /*
    handleUpvote
    Upvotes a word and updates local state if the user is logged in.
  */
  const handleUpvote = async (id) => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    try {
      const already = words.find((w) => w.id === id)?.user_has_upvoted;
      if (already) return;

      const res = await upvoteWord(id);

      setWords((ws) =>
        ws.map((w) =>
          w.id === id
            ? {
                ...w,
                upvotes: res.upvotes ?? w.upvotes,
                user_has_upvoted: !!res.user_has_upvoted,
              }
            : w
        )
      );
    } catch (e) {
      console.error('Upvote failed:', e);
    }
  };

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
                />
              </form>

              {loading ? <p className="muted home-loading">Loading...</p> : null}
            </div>
          </section>
        </div>
      </div>

      <OrbitActionMenu items={menuItems} />
    </GalaxyShell>
  );
}