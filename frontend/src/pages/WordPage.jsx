import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchWordById, fetchSimilar, fetchTrends, upvoteWord } from "../api/words";

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
import "../style/FloatingSimilar.css"; // ensure this exists from earlier step


function FloatingSimilar({ centerWord, items = [], onClick }) {
  const rings = [110, 160, 210];

  // Simple polar layout
  const placed = items.slice(0, 18).map((n, i) => {
    const ring = rings[i % rings.length];
    const angle = (i * (360 / Math.max(items.length, 1))) + ((i * 13) % 20);
    const rad = (angle * Math.PI) / 180;
    const x = ring * Math.cos(rad);
    const y = ring * Math.sin(rad);
    return { ...n, x, y };
  });

  return (
    <div className="floating-container">
      <div className="floating-center">{centerWord}</div>
      <svg className="floating-rings" viewBox="-210 -210 420 420">
        {rings.map((r, idx) => (
          <circle key={idx} cx="0" cy="0" r={r} className="floating-ring" />
        ))}
      </svg>
      {placed.map((n) => (
        <button
          key={n.id}
          className="floating-node"
          style={{
            left: "50%",
            top: "50%",
            transform: `translate(calc(-50% + ${n.x}px), calc(-50% + ${n.y}px))`,
          }}
          title={`similarity: ${Number(n.score || 0).toFixed(2)}`}
          onClick={() => onClick?.(n)}
        >
          {n.word}
        </button>
      ))}
    </div>
  );
}

export default function WordPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [word, setWord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similar, setSimilar] = useState([]);

  useEffect(() => {
    if (!id) return;

    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        // 1) word details
        const data = await fetchWordById(id);
        const wordData = Array.isArray(data) ? data[0] : data;
        if (!mounted) return;
        setWord(wordData || null);

        // 2) trends (safe: returns empty on failure)
       if (wordData?.word) {
         const t = await fetchTrends(wordData.word);
         if (mounted) {
           setWord(prev => prev ? { ...prev, trend: t.trend || [], topRegion: t.topRegion || null } : prev);
         }
       }

        // 3) similar words (robust; returns [])
        const sims = await fetchSimilar({ wordId: Number(id), limit: 12 });
        if (!mounted) return;
        setSimilar(Array.isArray(sims) ? sims : []);
      } catch (err) {
        console.error("WordPage load error:", err);
        if (mounted) {
          setWord(null);
          setSimilar([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [id]);

  if (loading) {
    return <p style={{ color: "white", textAlign: "center" }}>Loading...</p>;
  }

  if (!word) {
    return <p style={{ color: "white", textAlign: "center" }}>Word not found.</p>;
  }

  const handleUpvote = async () => {
  if (!word) return;
  try {
    // optimistic: if already upvoted, do nothing
    if (word.user_has_upvoted) return;

    const prev = word.upvotes || 0;
    setWord({ ...word, upvotes: prev + 1, user_has_upvoted: true });

    const res = await upvoteWord(word.id);
    // sync with server return
    setWord(w => w ? ({ ...w, upvotes: res.upvotes ?? (prev + 1), user_has_upvoted: !!res.user_has_upvoted }) : w);
  } catch (e) {
    console.error("upvote failed", e);
    // revert optimistic update on failure
    setWord(w => w ? ({ ...w, upvotes: (w.upvotes || 1) - 1, user_has_upvoted: false }) : w);
  }
};
  return (
    <div className="fiery-bg">
      <div className="glass-card">
        {/* Header */}
        <header className="word-header">
          <div>
            <h1>{word.word}</h1>
            {typeof word.trend_score === "number" && word.trend_score >= 70 && (
              <small className="pos">🔥 Trending</small>
            )}
          </div>

          <div className="actions">
            <button
           className="btn-glow"
            onClick={handleUpvote}
            disabled={!!word.user_has_upvoted}
         title={word.user_has_upvoted ? "Already upvoted" : "Upvote"}
 >
   👍 {word.upvotes ?? 0}
 </button>
            <span className="trend-pill">{word.trend_score ?? 0}</span>
          </div>
        </header>

        {/* Similar words orbit */}
        <section className="chart-container" style={{ marginTop: 16 }}>
          {Array.isArray(similar) && similar.length > 0 ? (
            <FloatingSimilar
              centerWord={word.word}
              items={similar}
              onClick={(n) => navigate(`/word/${n.id}`)}
            />
          ) : (
            <p className="no-trend" style={{ textAlign: "center", color: "white" }}>
              No similar words yet.
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
        </section>

        {/* Trend chart (kept, but fetchSimilar no longer depends on it) */}
        {Array.isArray(word.trend) && word.trend.length > 0 && (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={word.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: "white" }} />
                <YAxis tick={{ fill: "white" }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#FFD36E" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Footer */}
        <footer className="meta">
          Last updated: {new Date().toLocaleDateString()}
        </footer>
      </div>
    </div>
  );
}
