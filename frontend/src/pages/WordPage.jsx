import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchWordById, upvoteWord } from "../api/words";
import { Line } from "react-chartjs-2";
import "chart.js/auto";
import "../style/WordPage.css";

export default function WordPage() {
  const { id } = useParams();
  const [word, setWord] = useState(null);

  

  useEffect(() => {
  if (!id) return;

  const getWord = async () => {
    try {
      const data = await fetchWordById(id);
      console.log("Fetched word:", data);
      setWord(Array.isArray(data) ? data[0] : data);
    } catch (err) {
      console.error("Failed to fetch word:", err);
    }
  };

  getWord();
}, [id]);


  const handleUpvote = async () => {
    await upvoteWord(word.id);
    setWord((prev) => ({ ...prev, upvotes: prev.upvotes + 1 }));
  };

  if (!word) return <p style={{ color: "white", textAlign: "center" }}>Loading...</p>;

  // Example trend data (replace with backend data later)
  /*const trendData = {
    labels: ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"],
    datasets: [
      {
        label: "Trend Score",
        data: [12, 19, 33, 50, 61, 70, word.trend_score || 80],
        borderColor: "#FFD36E",
        backgroundColor: "rgba(255, 211, 110, 0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  };*/

  /*const trendOptions = {
    plugins: { legend: { display: false } },
    scales: { x: { ticks: { color: "white" } }, y: { ticks: { color: "white" } } },
  };*/

  return (
    <div className="fiery-bg">
      <div className="glass-card">
        <header className="word-header">
          <div>
            <h1>{word.word}</h1>
            <small className="pos">🔥 Trending</small>
          </div>

          <div className="actions">
            <button onClick={handleUpvote} className="btn-glow">
              👍 {word.upvotes}
            </button>
            <span className="trend-pill">{word.trend_score ?? 0}</span>
          </div>
        </header>

        <section className="word-body">
          <p><strong>Definition:</strong> {word.definition}</p>
          <p><strong>Examples:</strong> {word.examples}</p>
        </section>

        <div className="chart-container">
          
        </div>

        <footer className="meta">
          Last updated: {new Date().toLocaleDateString()} • Top country:{" "}
          {word.trend_country || "N/A"}
        </footer>
      </div>
    </div>
  );
}

