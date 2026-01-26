import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import * as wordsApi from '../api/words';
import GalaxyShell from '../components/layout/GalaxyShell';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

/*
  Local constants
  Kept near the top so this page is easy to tune without searching through JSX.
*/
const SIMILAR_LIMIT = 12;
const TRENDING_THRESHOLD = 70;
const TREND_CHART_HEIGHT_PX = 300;

/*
  WordPage
  Displays details for a single word (definition, examples, metadata) and related content.

  Notes:
  - Wrapped in GalaxyShell for consistent background.
  - Uses simple, themed layout primitives (app-card, item-card, chip, status-pill).
*/
export default function WordPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [word, setWord] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isLoggedIn = !!user;

  /*
    load
    Fetches the word, trend data, and similar words.
  */
  useEffect(() => {
    if (!id) return;

    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        // 1) Load word data
        const data = await wordsApi.fetchWordById(id);
        const wordData = Array.isArray(data) ? data[0] : data;

        if (!mounted) return;
        setWord(wordData || null);

        // 2) Fetch trend metadata (optional)
        if (wordData?.word) {
          const t = await wordsApi.fetchTrends(wordData.word);
          if (mounted) {
            setWord((current) => ({
              ...(current || wordData),
              trend: t?.trend || [],
              topRegion: t?.topRegion || null,
            }));
          }
        }


        // 3) Fetch similar words
        if (wordsApi.fetchSimilar) {
          try {
            const sims = await wordsApi.fetchSimilar({ wordId: Number(id), limit: SIMILAR_LIMIT });
            if (mounted) setSimilar(Array.isArray(sims) ? sims : []);
          } catch (e) {
            console.warn('Similar fetch failed:', e);
            if (mounted) setSimilar([]);
          }
        }
      } catch (e) {
        console.error('WordPage load error:', e);
        if (mounted) {
          setWord(null);
          setSimilar([]);
          setError('Word not found or failed to load.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [id]);

  /*
    handleUpvote
    Upvotes a word (requires login). Uses an optimistic update.
  */
  const handleUpvote = async () => {
    if (!word) return;
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    try {
      if (word.user_has_upvoted) return;

      // Optimistic UI update
      const prevUpvotes = word.upvotes || 0;
      setWord({ ...word, upvotes: prevUpvotes + 1, user_has_upvoted: true });

      const res = await wordsApi.upvoteWord(word.id);
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
      console.error('Upvote failed:', e);
      // Revert optimistic update on failure
      setWord((current) =>
        current
          ? {
              ...current,
              upvotes: Math.max(0, (current.upvotes || 1) - 1),
              user_has_upvoted: false,
            }
          : current
      );
    }
  };

  /*
    trendLabel
    Keeps the trending rule simple and defensive.
  */
  const trendLabel = useMemo(() => {
    if (!word) return null;
    if (typeof word.trend_score === 'number' && word.trend_score >= TRENDING_THRESHOLD) {
      return <span className="status-pill status-pill--trending">Trending</span>;
    }
    return null;
  }, [word]);

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
            <p className="error-text">{error || 'Word not found.'}</p>
            <button className="app-button" type="button" onClick={() => navigate('/')}>
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
                <div className="row-wrap" style={{ alignItems: 'center' }}>
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
                  title={word.user_has_upvoted ? 'Already upvoted' : 'Upvote'}
                >
                  Upvote ({word.upvotes ?? 0})
                </button>
                <button
                  className="app-button app-button--secondary"
                  type="button"
                  onClick={() => navigate('/')}
                >
                  Back
                </button>
              </div>
            </div>

            <div className="stack" style={{ marginTop: 16 }}>
              <div className="item-card">
                <strong>Definition</strong>
                <p style={{ marginBottom: 0 }}>{word.definition || 'No definition provided.'}</p>
              </div>

              <div className="item-card">
                <strong>Examples</strong>
                <p style={{ marginBottom: 0 }}>{word.examples || 'No examples provided.'}</p>
              </div>

              <div className="item-card">
                <strong>Similar words</strong>
                {Array.isArray(similar) && similar.length ? (
                  <div className="row-wrap" style={{ marginTop: 10 }}>
                    {similar.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className="chip"
                        title={typeof s.score === 'number' ? `similarity: ${s.score.toFixed(2)}` : 'Similar word'}
                        onClick={() => navigate(`/word/${s.id}`)}
                      >
                        {s.word}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="muted" style={{ marginBottom: 0 }}>
                    No similar words yet.
                  </p>
                )}
              </div>

              <div className="item-card">
                <strong>Trend</strong>
                {Array.isArray(word.trend) && word.trend.length > 0 ? (
                  <div style={{ width: '100%', height: TREND_CHART_HEIGHT_PX, marginTop: 12 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={word.trend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fill: 'white' }} />
                        <YAxis tick={{ fill: 'white' }} />
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