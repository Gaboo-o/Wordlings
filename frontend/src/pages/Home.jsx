import { useEffect, useState } from 'react';
import { fetchWords, upvoteWord } from '../api/words';
import { useNavigate } from 'react-router-dom';

import  WordCard  from '../components/WordCard';

export default function Home() {
  const [words, setWords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sort, setSort] = useState('alphabetical');
  const navigate = useNavigate();

  const loadWords = async () => {
    const data = await fetchWords({ search: searchTerm, sort });
    setWords(data);
  };

  useEffect(() => {
    loadWords();
  }, [sort]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadWords();
  };

  const handleUpvote = async (id) => {
    await upvoteWord(id);
    setWords(words.map(w => w.id === id ? { ...w, upvotes: w.upvotes + 1 } : w));
  };

  return (
  <div style={{ padding: '24px' }}>
    <h1 style={{ textAlign: 'center' }}>🔥 Wordlings</h1>

    {/* Search & Sort */}
    <form onSubmit={handleSearch} style={{ display:'flex', marginBottom:'16px', gap:'8px', justifyContent: 'center' }}>
      <input
        placeholder="Search words..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        style={{ padding:'8px', width:'300px', borderRadius:'8px', border:'1px solid #ccc' }}
      />
      <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding:'8px', borderRadius:'8px' }}>
        <option value="alphabetical">A–Z</option>
        <option value="popular">Most Upvoted</option>
      </select>
      <button type="submit" style={{ padding:'8px 16px' }}>Search</button>
    </form>

    {/* Add Word */}
    <div style={{ textAlign: 'center', marginBottom:'24px' }}>
      <button onClick={() => navigate('/add')} style={{ padding:'8px 16px' }}>
        ➕ Add Word
      </button>
    </div>

    {/* WordCard Grid */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px'
    }}>
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
