import { useEffect, useState } from 'react';
import { fetchWords, searchWords, upvoteWord } from '../api/words';
import { useNavigate } from 'react-router-dom';
import WordCard from '../components/WordCard';

export default function Home() {
  const [words, setWords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sort, setSort] = useState('alphabetical');
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('Guest');

  const navigate = useNavigate();

  const loadWords = async () => {
    setLoading(true);
    try {
      let data;
      if (searchTerm.trim()) {
        data = await searchWords(searchTerm);
      } else {
        data = await fetchWords({ sort });
      }
      setWords(data);
    } catch (error) {
      console.error('Failed to load words:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWords();
  }, [sort, searchTerm]);

  useEffect(() => {
    const user = { id: 1, username: 'TestUser' }; // mock - replace later
    if (user && user.id) {
      setIsLoggedIn(true);
      setUsername(user.username);
    }
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
  };

  const handleUpvote = async (id) => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    setWords(words.map(w => w.id === id ? { ...w, upvotes: (w.upvotes || 0) + 1 } : w));
    await upvoteWord(id);
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

      <button
        onClick={() => navigate('/add')}
        disabled={!isLoggedIn}
      >
        Add Word
      </button>

      {loading && <p>Loading...</p>}

      <div>
        {words.map(w => (
          <WordCard
            key={w.id}
            word={{ ...w, onUpvote: handleUpvote }}
            onClick={() => navigate(`/word/${w.id}`)}
            isLoggedIn={isLoggedIn}
          />
        ))}
      </div>
    </div>
  );
}
