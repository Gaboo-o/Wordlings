import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { addWord } from '../api/words';
import { getErrorMessage } from '../api/errors';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  /*
    handleSubmit
    Sends the new word to the API, then returns to the home page.
  */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await addWord({ word, definition, examples });
      // After submitting, take the user to Submissions so they can see the pending entry.
      navigate('/submissions');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to submit word'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <GalaxyShell>
      <div className="centered">
        <div className="app-card">
          <h2>Add a New Word</h2>

          {error ? <p className="error-text">{error}</p> : null}

          <form onSubmit={handleSubmit} className="form-grid">
            <label className="sr-only" htmlFor="word">Word</label>
            <input
              id="word"
              className="app-input"
              placeholder="Word"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              required
              autoComplete="off"
            />
            <label className="sr-only" htmlFor="definition">Definition</label>
            <input
              id="definition"
              className="app-input"
              placeholder="Definition"
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              required
            />
            <label className="sr-only" htmlFor="examples">Examples</label>
            <input
              id="examples"
              className="app-input"
              placeholder="Examples"
              value={examples}
              onChange={(e) => setExamples(e.target.value)}
            />
            <button className="app-button" type="submit" disabled={loading}>
              {loading ? 'Submitting…' : 'Submit'}
            </button>
          </form>
        </div>
      </div>
    </GalaxyShell>
  );
}