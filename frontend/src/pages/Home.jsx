import { useEffect, useState } from 'react';
import { fetchWords, searchWords, upvoteWord } from '../api/words';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WordCard from '../components/WordCard';

export default function Home() {
  const [words, setWords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sort, setSort] = useState('alphabetical');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [err, setErr] = useState("");
  const isLoggedIn = !!user;
  const username = user ? user.username || 'You' : 'Guest';

  const loadWords = async () => {
    setLoading(true);
    try {
      let data;
      if (searchTerm.trim()) {
        data = await searchWords(searchTerm);
      } else {
        data = await fetchWords({ sort });
      }
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

  const handleSearch = (e) => {
    e.preventDefault();
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleUpvote = async (id) => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    try {
      const already = words.find(w => w.id === id)?.user_has_upvoted;
      if (already) return;

      const res = await upvoteWord(id);

      setWords(ws => ws.map(w =>
        w.id === id
          ? { ...w, upvotes: res.upvotes ?? w.upvotes, user_has_upvoted: !!res.user_has_upvoted }
          : w
      ));
    } catch (e) {
      console.error('Upvote failed:', e);
    }
  };

  return (
    <div>
      <h1>Wordlings</h1>
      <p>Welcome, {username}</p>

      <form onSubmit={handleSearch}>
        <input
          placeholder="Search words..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select value={sort} onChange={e => setSort(e.target.value)}>
          <option value="alphabetical">A–Z</option>
          <option value="popular">Most Upvoted</option>
        </select>
        <button type="submit">Search</button>
      </form>

      <button onClick={() => navigate('/add')}>
        Add Word
      </button>

      <button onClick={handleLogout}>
        Logout
      </button>

      {user?.is_admin && (
        <button onClick={() => navigate('/admin')}>
          Admin Dashboard
        </button>
      )}

      {loading && <p>Loading...</p>}

      <div>
        {words.map(w => (
          <WordCard
            key={w.id}
            word={{ ...w, onUpvote: handleUpvote }}
            onClick={() => navigate(`/word/${w.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
