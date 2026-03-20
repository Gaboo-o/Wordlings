// frontend/src/pages/WordPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import * as wordsApi from "../api/words";
import GalaxyShell from "../components/layout/GalaxyShell";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const SIMILAR_LIMIT = 12;
const TRENDING_THRESHOLD = 70;
const TREND_CHART_HEIGHT_PX = 300;

function SimilarOrbit({ centerWord, items = [], onSelect }) {
  const SIZE = 420;
  const CENTER = SIZE / 2;

  const BASE_RADIUS = 95;
  const RADIUS_SPREAD = 150;
  const MIN_RADIUS_STEP = 18;

  const MIN_ANGLE_GAP_DEG = 18;
  const MAX_PUSH_OUT = 55;
  const PUSH_STEP = 8;

  const rings = [BASE_RADIUS, BASE_RADIUS + 55, BASE_RADIUS + 115];
  const safe = Array.isArray(items) ? items.slice(0, 12) : [];

  const placed = safe
    .map((it, i) => {
      const s = typeof it.score === "number" ? it.score : 0.5;
      const targetR = BASE_RADIUS + (1 - s) * RADIUS_SPREAD;
      const angleDeg = (i / Math.max(1, safe.length)) * 360;
      return { ...it, _targetR: targetR, _angleDeg: angleDeg };
    })
    .sort((a, b) => a._targetR - b._targetR);

  const deg2rad = (d) => (d * Math.PI) / 180;

  const final = [];
  const takenAngles = [];

  for (const it of placed) {
    let angle = it._angleDeg;

    for (let tries = 0; tries < 30; tries++) {
      const ok = takenAngles.every((a) => {
        let diff = Math.abs(a - angle) % 360;
        diff = diff > 180 ? 360 - diff : diff;
        return diff >= MIN_ANGLE_GAP_DEG;
      });
      if (ok) break;
      angle = (angle + MIN_ANGLE_GAP_DEG) % 360;
    }

    let r = it._targetR + final.length * (MIN_RADIUS_STEP / Math.max(1, safe.length));

    const posFor = (rr, aa) => {
      const t = deg2rad(aa);
      return { x: CENTER + Math.cos(t) * rr, y: CENTER + Math.sin(t) * rr };
    };

    const COLLISION_DIST = 64;

    for (let push = 0; push <= MAX_PUSH_OUT; push += PUSH_STEP) {
      const p = posFor(r + push, angle);

      const hit = final.some((o) => {
        const dx = o._x - p.x;
        const dy = o._y - p.y;
        return Math.hypot(dx, dy) < COLLISION_DIST;
      });

      if (!hit) {
        r = r + push;
        break;
      }
    }

    const p = posFor(r, angle);

    takenAngles.push(angle);
    final.push({ ...it, _angleDeg: angle, _r: r, _x: p.x, _y: p.y });
  }

  return (
    <div style={{ display: "grid", placeItems: "center", marginTop: 12 }}>
      <div
        style={{
          width: SIZE,
          height: SIZE,
          position: "relative",
          borderRadius: 999,
          boxShadow: "0 0 26px rgba(106, 184, 255, 0.10)",
        }}
      >
        <svg
          width={SIZE}
          height={SIZE}
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
          aria-hidden="true"
        >
          {rings.map((rr, idx) => (
            <circle
              key={idx}
              cx={CENTER}
              cy={CENTER}
              r={rr}
              fill="none"
              stroke="rgba(255,255,255,0.16)"
              strokeDasharray="6 8"
            />
          ))}
        </svg>

        <button
          type="button"
          className="chip"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            padding: "12px 16px",
            fontWeight: 900,
            background: "rgba(106, 184, 255, 0.14)",
            borderColor: "rgba(106, 184, 255, 0.50)",
            boxShadow: "0 0 18px rgba(106, 184, 255, 0.18)",
            cursor: "default",
          }}
          title={centerWord}
          aria-label={centerWord}
          onClick={() => {}}
        >
          {centerWord}
        </button>

        {final.map((it) => (
          <button
            key={it.id}
            type="button"
            className="chip"
            onClick={() => onSelect?.(it.id)}
            title={`similarity: ${typeof it.score === "number" ? it.score.toFixed(2) : "?"}`}
            style={{
              position: "absolute",
              left: it._x,
              top: it._y,
              transform: "translate(-50%, -50%)",
              padding: "7px 11px",
              fontSize: "0.92rem",
              maxWidth: 140,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {it.word}
          </button>
        ))}
      </div>
    </div>
  );
}

function parseNumericId(raw) {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export default function WordPage() {
  const { id: rawParam } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const numericId = parseNumericId(rawParam);
  const wordSlug = numericId == null ? rawParam : null;

  const [word, setWord] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isLoggedIn = !!user;

  useEffect(() => {
    if (!rawParam) return;

    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        let wordData = null;

        if (numericId != null) {
          const data = await wordsApi.fetchWordById(numericId);
          wordData = Array.isArray(data) ? data[0] : data;
        } else {
          const data = await wordsApi.fetchWordByText(wordSlug);
          wordData = Array.isArray(data) ? data[0] : data;
        }

        if (!mounted) return;
        setWord(wordData || null);

        // Trends (by word text)
        if (wordData?.word && wordsApi.fetchTrends) {
          try {
            const t = await wordsApi.fetchTrends(wordData.word);
            if (mounted) {
              setWord((current) => ({
                ...(current || wordData),
                trend: t?.trend || [],
                topRegion: t?.topRegion || null,
              }));
            }
          } catch (e) {
            console.warn("Trend fetch failed:", e);
          }
        }

        // Similar only if we have a numeric id
        if (numericId != null && wordsApi.fetchSimilar) {
          try {
            const sims = await wordsApi.fetchSimilar({ wordId: numericId, limit: SIMILAR_LIMIT });
            if (mounted) setSimilar(Array.isArray(sims) ? sims : []);
          } catch (e) {
            console.warn("Similar fetch failed:", e);
            if (mounted) setSimilar([]);
          }
        } else {
          setSimilar([]);
        }
      } catch (e) {
        console.error("WordPage load error:", e);
        if (mounted) {
          setWord(null);
          setSimilar([]);
          setError("Word not found or failed to load.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [rawParam, numericId, wordSlug]);

  const handleUpvote = async () => {
    if (!word) return;
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    try {
      if (word.user_has_upvoted) return;

      const prevUpvotes = word.upvotes || 0;
      setWord({ ...word, upvotes: prevUpvotes + 1, user_has_upvoted: true });

      const res = await wordsApi.upvoteWord({ id: word.id });
      setWord((current) =>
        current
          ? {
              ...current,
              upvotes: res?.upvotes ?? prevUpvotes + 1,
              user_has_upvoted: !!res?.user_has_upvoted,
            }
          : current
      );
    } catch (e) {
      console.error("Upvote failed:", e);
      setWord((current) =>
        current
          ? { ...current, upvotes: Math.max(0, (current.upvotes || 1) - 1), user_has_upvoted: false }
          : current
      );
    }
  };

  const trendLabel = useMemo(() => {
    if (!word) return null;
    if (typeof word.trend_score === "number" && word.trend_score >= TRENDING_THRESHOLD) {
      return <span className="status-pill status-pill--trending">Trending</span>;
    }
    return null;
  }, [word]);

  const orbitItems = useMemo(() => {
    const sims = Array.isArray(similar) ? similar : [];
    if (!sims.length) return [];

    const scores = sims.map((s) => Number(s.score)).filter((n) => Number.isFinite(n));
    if (!scores.length) return sims.map((s) => ({ ...s, score: 0.5 }));

    const min = Math.min(...scores);
    const max = Math.max(...scores);
    if (max - min < 1e-9) return sims.map((s) => ({ ...s, score: 0.5 }));

    return sims.map((s) => {
      const v = Number(s.score);
      if (!Number.isFinite(v)) return { ...s, score: 0.5 };
      const norm = (v - min) / (max - min);
      const similarity = 1 - norm;
      return { ...s, score: similarity };
    });
  }, [similar]);

  if (loading) {
    return (
      <GalaxyShell>
        <div className="centered">
          <div className="app-card">
            <h2>Loading...</h2>
          </div>
        </div>
      </GalaxyShell>
    );
  }

  if (error || !word) {
    return (
      <GalaxyShell>
        <div className="centered">
          <div className="app-card">
            <h2>Word</h2>
            <p className="error-text">{error || "Word not found."}</p>
            <button className="app-button" type="button" onClick={() => navigate("/")}>
              Back to Home
            </button>
          </div>
        </div>
      </GalaxyShell>
    );
  }

  return (
    <GalaxyShell>
      <div className="page">
        <div className="page-inner">
          <div className="app-card app-card--wide">
            <div className="page-header">
              <div>
                <h1 className="page-title">{word.word}</h1>
                <div className="row-wrap" style={{ alignItems: "center" }}>
                  {trendLabel}
                  {word.topRegion ? (
                    <span className="status-pill">Top region: {word.topRegion}</span>
                  ) : null}
                </div>
              </div>

              <div className="page-actions">
                <button
                  className="app-button"
                  type="button"
                  onClick={handleUpvote}
                  disabled={!!word.user_has_upvoted}
                  title={word.user_has_upvoted ? "Already upvoted" : "Upvote"}
                >
                  Upvote ({word.upvotes ?? 0})
                </button>
                <button className="app-button app-button--secondary" type="button" onClick={() => navigate("/")}>
                  Back
                </button>
              </div>
            </div>

            <div className="stack" style={{ marginTop: 16 }}>
              <div className="item-card">
                <strong>Definition</strong>
                <p style={{ marginBottom: 0 }}>{word.definition || "No definition provided."}</p>
              </div>

              <div className="item-card">
                <strong>Examples</strong>
                <p style={{ marginBottom: 0 }}>{word.examples || "No examples provided."}</p>
              </div>

              <div className="item-card">
                <strong>Similar words</strong>

                {Array.isArray(orbitItems) && orbitItems.length ? (
                  <SimilarOrbit
                    centerWord={word.word}
                    items={orbitItems}
                    onSelect={(targetId) => {
                      if (!targetId) return;
                      navigate(`/word/${targetId}`);
                    }}
                  />
                ) : (
                  <p className="muted" style={{ marginBottom: 0 }}>
                    No similar words yet.
                  </p>
                )}
              </div>

              <div className="item-card">
                <strong>Trend</strong>
                {Array.isArray(word.trend) && word.trend.length > 0 ? (
                  <div style={{ width: "100%", height: TREND_CHART_HEIGHT_PX, marginTop: 12 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={word.trend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fill: "white" }} />
                        <YAxis tick={{ fill: "white" }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="var(--color-accent)" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="muted" style={{ marginBottom: 0 }}>
                    No trend data available.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </GalaxyShell>
  );
}