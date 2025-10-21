import { useState } from 'react';
import { addWord } from '../api/words';
import { useNavigate } from 'react-router-dom';

export default function AddWordPage() {
  const [word, setWord] = useState('');
  const [definition, setDefinition] = useState('');
  const [examples, setExamples] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addWord({ word, definition, examples });
    navigate('/');
  };

  return (
    <div>
      <h2>Add a New Word</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <input
          placeholder="Word"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          required
        />
        <input
          placeholder="Definition"
          value={definition}
          onChange={(e) => setDefinition(e.target.value)}
        />
        <input
          placeholder="Examples"
          value={examples}
          onChange={(e) => setExamples(e.target.value)}
        />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}
