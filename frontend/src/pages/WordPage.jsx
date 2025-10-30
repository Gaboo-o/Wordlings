import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchWordById } from "../api/words";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import "../style/WordPage.css";

export default function WordPage() {
  const { id } = useParams();
  const [word, setWord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const getWord = async () => {
      try {
        // Fetch word from backend
        const data = await fetchWordById(id);
        const wordData = Array.isArray(data) ? data[0] : data;
        setWord(wordData);

        // Fetch Google Trends data
        if (wordData && wordData.word) {
          const trendsResponse = await fetch(`/api/trends/${encodeURIComponent(wordData.word)}`);
          const trendsData = await trendsResponse.json();

          setWord((prev) => ({
            ...prev,
            trend: trendsData.trend,
            topRegion: trendsData.topRegion,
          }));
        }
      } catch (err) {
        console.error("Failed to fetch word or trends:", err);
      } finally {
        setLoading(false);
      }
    };

    getWord();
  }, [id]);

  if (loading) return <p style={{ color: "white", textAlign: "center" }}>Loading...</p>;
  if (!word) return <p style={{ color: "white", textAlign: "center" }}>Word not found.</p>;

  return (
    <div className="fiery-bg">
      <div className="glass-card">
        <header className="word-header">
          <div>
            <h1>{word.word}</h1>
            <small className="pos">🔥 Trending</small>
          </div>

          <div className="actions">
            <button className="btn-glow">👍 {word.upvotes ?? 0}</button>
            <span className="trend-pill">{word.trend_score ?? 0}</span>
          </div>
        </header>

        <section className="word-body">
          <p><strong>Definition:</strong> {word.definition}</p>
          <p><strong>Examples:</strong> {word.examples}</p>
          {word.topRegion && (
            <p><strong>Top Region:</strong> 🌍 {word.topRegion}</p>
          )}
        </section>

        <div className="chart-container">
          {word.trend && word.trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={word.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: "white" }} />
                <YAxis tick={{ fill: "white" }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#FFD36E" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="no-trend">No trend data available.</p>
          )}
        </div>

        <footer className="meta">
          Last updated: {new Date().toLocaleDateString()} • Top country:{" "}
          {word.topRegion || "N/A"}
        </footer>
      </div>
    </div>
  );
}
