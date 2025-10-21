import { useEffect, useState } from 'react';
import { fetchWords } from '../api/words';
import { useParams } from 'react-router-dom';

export default function WordPage() {
  const { id } = useParams();
  const [word, setWord] = useState(null);

  useEffect(() => {
    fetchWords(id).then(setWord);
  }, [id]);

  if (!word) return <p>Loading...</p>;

  return (
    <div>
      <h2>{word.word}</h2>
      {word.trend_score > 0 && (
        <p>Trend Score: {word.trend_score} | Top Country: {word.trend_country || 'N/A'}</p>
      )}
      <p><strong>Definition:</strong> {word.definition}</p>
      <p><strong>Examples:</strong> {word.examples}</p>
    </div>
  );
}
