import '../style/WordCard.css';

export default function WordCard({ word, onClick }) {
  const gradient = `linear-gradient(to bottom right, ${word.color1 || '#7F7FD5'}, ${word.color2 || '#86A8E7'})`;

  return (
    <div 
      className="word-card"
      style={{ background: gradient }}
      onClick={onClick}
    >
      <div className="word-card-content">
        <h3>
          {word.word}
          {word.trend_score > 70 && <span className="badge">🔥 Trending</span>}
        </h3>
        <p>{word.definition || "No definition available."}</p>
        <div className="upvote-section">
          <button className="upvote-btn" onClick={(e) => {
            e.stopPropagation();
            word.onUpvote(word.id);
          }}>
            👍 {word.upvotes}
          </button>
        </div>
      </div>
    </div>
  );
}
