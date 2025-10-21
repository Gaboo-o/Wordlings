import '../style/WordCard.css';

export default function WordCard({ title, description }) {
  return (
    <div className="word-card">
      
      <div className="word-card-content">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}
