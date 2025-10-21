import { useEffect, useState } from 'react';
import { fetchWords, upvoteWord } from '../api/words';
import { useNavigate } from 'react-router-dom';

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
    <div>
      <h1>Wordlings</h1>

      {/* Search & Sort */}
      <form onSubmit={handleSearch} style={{ display:'flex', marginBottom:'16px', gap:'8px' }}>
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

      {/* Add Word */}
      <button onClick={() => navigate('/add')} style={{ marginBottom:'16px' }}>
        Add Word
      </button>

      {/* Word Table */}
      <table border="1" cellPadding="8" cellSpacing="0" width="100%">
        <thead>
          <tr>
            <th>Word</th>
            <th>Definition</th>
            <th>Examples</th>
            <th>Upvotes</th>
          </tr>
        </thead>
        <tbody>
          {words.map(w => (
            <tr key={w.id}>
              <td>
                <a href={`/word/${w.id}`} style={{ fontWeight:'bold', textDecoration:'none' }}>
                  {w.word}
                </a>
                {w.trend_score > 70 && (
                  <span style={{ marginLeft:'8px', color:'orange', fontWeight:'bold' }}>🔥 Trending</span>
                )}
              </td>
              <td>{w.definition}</td>
              <td>{w.examples}</td>
              <td>
                <button onClick={() => handleUpvote(w.id)}>
                  👍 {w.upvotes} Upvotes
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
