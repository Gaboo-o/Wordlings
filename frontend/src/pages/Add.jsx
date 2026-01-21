import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { addWord } from '../api/words';
import GalaxyShell from '../components/layout/GalaxyShell';

/*
  AddWordPage
  Form page for submitting a new word.
  Wrapped in GalaxyShell so it shares the same background as other pages.
*/
export default function AddWordPage() {
  const [word, setWord] = useState('');
  const [definition, setDefinition] = useState('');
  const [examples, setExamples] = useState('');

  const navigate = useNavigate();

  /*
    handleSubmit
    Sends the new word to the API, then returns to the home page.
  */
  const handleSubmit = async (e) => {
    e.preventDefault();
    await addWord({ word, definition, examples });
    navigate('/');
  };

  return (
    <GalaxyShell>
      <div className="centered">
        <div className="app-card">
          <h2>Add a New Word</h2>

          <form onSubmit={handleSubmit} className="form-grid">
            <input
              className="app-input"
              placeholder="Word"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              required
            />
            <input
              className="app-input"
              placeholder="Definition"
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              required
            />
            <input
              className="app-input"
              placeholder="Examples"
              value={examples}
              onChange={(e) => setExamples(e.target.value)}
            />
            <button className="app-button" type="submit">
              Submit
            </button>
          </form>
        </div>
      </div>
    </GalaxyShell>
  );
}