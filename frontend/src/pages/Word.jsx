import { useEffect, useState } from 'react';
import { fetchWordById } from '../api/words';
import { useParams, Link } from 'react-router-dom';

export default function WordPage() {
  const { id } = useParams();
  const [word, setWord] = useState(null);

  useEffect(() => {
    fetchWordById(id)
      .then(setWord)
      .catch((err) => console.error('Error fetching word:', err));
  }, [id]);

  if (!word) return <p className="text-center mt-20 text-lg text-gray-500">Loading...</p>;

  const backgroundStyle = {
    background: `linear-gradient(135deg, ${word.color1 || '#6a11cb'}, ${word.color2 || '#2575fc'})`,
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={backgroundStyle}
    >
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <h1 className="text-4xl font-bold mb-4">{word.word}</h1>

        {word.trend_score > 0 && (
          <div className="mb-4 inline-block px-4 py-1 bg-gradient-to-r from-pink-500 to-orange-400 text-white rounded-full text-sm font-semibold">
            🔥 Trending — {word.trend_score}
          </div>
        )}

        <p className="text-gray-700 mb-3">
          <strong>Definition:</strong> {word.definition}
        </p>

        {word.examples && (
          <p className="text-gray-600 italic mb-6">“{word.examples}”</p>
        )}

        {word.trend_country && (
          <p className="text-gray-700 mb-6">
            🌍 Popular in <strong>{word.trend_country}</strong>
          </p>
        )}

        <Link
          to="/"
          className="inline-block px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
        >
          ← Back Home
        </Link>
      </div>
    </div>
  );
}
