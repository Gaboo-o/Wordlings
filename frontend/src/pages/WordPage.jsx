// frontend/src/pages/WordPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchWordById, fetchSimilar } from "../api/words";
import FloatingSimilar from "../components/FloatingSimilar";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

import "../style/WordPage.css"; // your existing styles

export default function WordPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [word, setWord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similar, setSimilar] = useState([]);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);
      try {
        // 1) Fetch the word details
        const data = await fetchWordById(id);
        const wordData = Array.isArray(data) ? data[0] : data;
        setWord(wordData);

        // 2) Fetch Google Trends for this word
        if (wordData?.word) {
          const trendsResponse = await fetch(
            `/api/trends/${encodeURIComponent(wordData.word)}`
          );
          const trendsData = await trendsResponse.json();
          setWord((prev) => ({
            ...prev,
            trend: trendsData.trend || [],
            topRegion: trendsData.topRegion || null,
          }));
        }

        // 3) Fetch similar words (AI/embeddings)
        //const sims = await fetchSimilar({ wordId: Number(id), limit: 12 });
        //setSimilar(Array.isArray(sims) ? sims : []);
      } catch (err) {
        console.error("Failed to load word page:", err);
        setWord(null);
        setSimilar([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) {
    return <p style={{ color: "white", textAlign: "center" }}>Loading...</p>;
  }

  if (!word) {
    return <p style={{ color: "white", textAlign: "center" }}>Word not found.</p>;
  }

  return (
    <div className="fiery-bg">
      <div className="glass-card">
        {/* Header */}
        <header className="word-header">
          <div>
            <h1>{word.word}</h1>
            {/* Show trending badge if you want to use your trend_score */}
            {typeof word.trend_score === "number" && word.trend_score >= 70 && (
              <small className="pos">🔥 Trending</small>
            )}
          </div>

          <div className="actions">
            <button className="btn-glow">👍 {word.upvotes ?? 0}</button>
            <span className="trend-pill">{word.trend_score ?? 0}</span>
          </div>
        </header>

        {/* Similar words orbit */}
        <section className="chart-container" style={{ marginTop: 16 }}>
          {similar.length > 0 ? (
            <FloatingSimilar
              centerWord={word.word}
              items={similar}
              onClick={(n) => navigate(`/word/${n.id}`)}
            />
          ) : (
            <p className="no-trend" style={{ textAlign: "center", color: "white" }}>
              No similar words yet. Add a few more words to see suggestions here.
            </p>
          )}
        </section>

        {/* Definition / examples */}
        <section className="word-body">
          <p>
            <strong>Definition:</strong> {word.definition}
          </p>
          <p>
            <strong>Examples:</strong> {word.examples}
          </p>
          {word.topRegion && (
            <p>
              <strong>Top Region:</strong> 🌍 {word.topRegion}
            </p>
          )}
        </section>

        {/* Trend chart */}
        <div className="chart-container">
          {word.trend && word.trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={word.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: "white" }} />
                <YAxis tick={{ fill: "white" }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#FFD36E"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="no-trend">No trend data available.</p>
          )}
        </div>

        {/* Footer */}
        <footer className="meta">
          Last updated: {new Date().toLocaleDateString()} • Top country:{" "}
          {word.topRegion || "N/A"}
        </footer>
      </div>
    </div>
  );
}
