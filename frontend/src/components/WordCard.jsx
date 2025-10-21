export default function WordCard({ word }) {
  return (
    <div className="word-card">
      <h3>{word.word} {word.trend_score > 70 && <span>🔥</span>}</h3>
      <p>{word.definition}</p>
      <p>{word.examples}</p>
      <p>Upvotes: {word.upvotes}</p>
    </div>
  );
}
