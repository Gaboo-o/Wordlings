import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import { GALAXY_CONFIG, TWO_PI } from '../../config/galaxyConfig';
import DebugOverlay from '../debug/DebugOverlay';
import FlyingMeteor from './FlyingMeteor';
import OrbitMeteor from './OrbitMeteor';

/*
  matchStrength
  Computes a simple relevance score for a word given a query.
  The scoring values are configured in GALAXY_CONFIG.
*/
function matchStrength(word, query) {
  const w = (word || '').toLowerCase();
  const q = (query || '').toLowerCase();

  if (!q) return 0;
  if (w === q) return GALAXY_CONFIG.MATCH_SCORE_EXACT;
  if (w.startsWith(q)) return GALAXY_CONFIG.MATCH_SCORE_STARTS_WITH;
  if (w.includes(q)) return GALAXY_CONFIG.MATCH_SCORE_INCLUDES;
  return 0;
}

/*
  computeSearchResults
  Returns a capped, sorted list of matches for the debounced query.
*/
function computeSearchResults(words, debouncedQuery) {
  if (!debouncedQuery || debouncedQuery.length < GALAXY_CONFIG.SEARCH_MIN_QUERY_LEN) {
    return [];
  }

  return words
    .map((w) => ({ id: w.id, word: w.word, s: matchStrength(w.word, debouncedQuery) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, GALAXY_CONFIG.SEARCH_MAX_RESULTS);
}

/*
  buildOrbiters
  Converts search results into orbiting labels.
  Closest matches orbit closer to the center.
*/
function buildOrbiters(results) {
  const n = results.length;
  if (!n) return [];

  return results.map((it, i) => {
    const radius =
      GALAXY_CONFIG.ORBIT_RADIUS_MIN_PX +
      (1 - it.s) * GALAXY_CONFIG.ORBIT_RADIUS_MATCH_SPREAD_PX +
      i * GALAXY_CONFIG.ORBIT_RADIUS_INDEX_STEP_PX;

    const angle = (i / Math.max(1, n)) * TWO_PI;

    return {
      id: it.id,
      wordId: it.id,
      word: it.word,
      score: it.s,
      radius,
      angle,
    };
  });
}

/*
  computeFlySizePx
  Maps an upvote count to a visual size in pixels.
  Uses a logarithmic curve so large upvote counts do not explode the UI.
*/
function computeFlySizePx(upvotes) {
  const v = Math.max(0, Number(upvotes) || 0);
  const raw = GALAXY_CONFIG.FLY_SIZE_MIN_PX + Math.log2(v + 1) * GALAXY_CONFIG.FLY_SIZE_LOG_MULT;
  return Math.min(GALAXY_CONFIG.FLY_SIZE_MAX_PX, Math.max(GALAXY_CONFIG.FLY_SIZE_MIN_PX, raw));
}

/*
  MeteorField
  Renders:
  - Always-on flying meteors (proven stable)
  - Orbiting search matches (proven stable)
  - Optional debug overlay (centralized and globally toggleable)

  Intentionally excluded for simplicity (for now):
  - Orbit release / fly-off transitions
  - Stopping spawns during search
*/
export default function MeteorField({ words = [], query = '' }) {
  const navigate = useNavigate();

  const [flying, setFlying] = useState([]);
  const pausedRef = useRef(false);

  // Used only for debugging. Stores a few live positions without causing re-renders.
  const flyingPosRef = useRef(new Map()); // id -> { word, x, y, vx }

  const debouncedQuery = useDebouncedValue(query, GALAXY_CONFIG.SEARCH_DELAY_MS);

  // Identify the top words by upvotes so we can render them with a distinct "ship" variant.
  const shipWordIds = useMemo(() => {
    const topN = Math.max(0, GALAXY_CONFIG.FLY_SHIP_TOP_N);
    if (!topN || !words.length) return new Set();

    const sorted = [...words].sort(
      (a, b) => (Number(b?.upvotes) || 0) - (Number(a?.upvotes) || 0)
    );

    return new Set(sorted.slice(0, topN).map((w) => w.id));
  }, [words]);

  const results = useMemo(
    () => computeSearchResults(words, debouncedQuery),
    [words, debouncedQuery]
  );

  const orbiters = useMemo(() => buildOrbiters(results), [results]);

  const mode =
    query && query.length >= GALAXY_CONFIG.SEARCH_MIN_QUERY_LEN
      ? debouncedQuery === query
        ? 'SEARCH_ACTIVE'
        : 'SEARCH_PENDING'
      : 'FLYING';

  useEffect(() => {
    // Crucial: browsers pause requestAnimationFrame in background tabs.
    // Without pausing spawning too, meteors accumulate and appear to jump on return.
    const onVis = () => {
      pausedRef.current = document.hidden;
    };

    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    const spawnInterval = window.setInterval(() => {
      if (pausedRef.current) return;
      if (!words.length) return;

      const fromLeft = Math.random() > 0.5;
      const w = words[Math.floor(Math.random() * words.length)];

      const x = fromLeft
        ? -GALAXY_CONFIG.FLY_SPAWN_X_MARGIN_PX
        : window.innerWidth + GALAXY_CONFIG.FLY_SPAWN_X_MARGIN_PX;

      const y =
        Math.random() *
        (window.innerHeight * GALAXY_CONFIG.FLY_SPAWN_Y_MAX_RATIO);

      const vx = fromLeft
        ? GALAXY_CONFIG.FLY_SPEED_PX_PER_FRAME
        : -GALAXY_CONFIG.FLY_SPEED_PX_PER_FRAME;

      const upvotes = Number(w?.upvotes) || 0;
      const sizePx = computeFlySizePx(upvotes);
      const variant = shipWordIds.has(w.id) ? 'ship' : 'meteor';

      setFlying((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          wordId: w.id,
          word: w.word,
          upvotes,
          sizePx,
          variant,
          x,
          y,
          vx,
        },
      ]);
    }, GALAXY_CONFIG.FLY_SPAWN_INTERVAL_MS);

    return () => clearInterval(spawnInterval);
  }, [words, shipWordIds]);

  const removeFlying = (meteorId) => {
    setFlying((prev) => prev.filter((m) => m.id !== meteorId));
    flyingPosRef.current.delete(meteorId);
  };

  const onSelectWord = (item) => {
    if (!item?.wordId) return;
    navigate(`/word/${item.wordId}`);
  };

  const sampleFlying = useMemo(() => {
    if (!GALAXY_CONFIG.DEBUG_ENABLED) return [];

    const out = [];
    for (const [id, v] of flyingPosRef.current.entries()) {
      out.push({ id, ...v });
      if (out.length >= GALAXY_CONFIG.DEBUG_SAMPLE_FLYING_COUNT) break;
    }
    return out;
  }, [flying.length, mode]);

  const debugData = GALAXY_CONFIG.DEBUG_ENABLED
    ? {
        mode,
        query,
        debouncedQuery,
        flyingCount: flying.length,
        results,
        sampleFlying,
      }
    : null;

  return (
    <>
      <DebugOverlay data={debugData} />

      {flying.map((m) => (
        <FlyingMeteor
          key={m.id}
          meteor={m}
          pausedRef={pausedRef}
          despawnMarginPx={GALAXY_CONFIG.FLY_DESPAWN_MARGIN_PX}
          onDone={() => removeFlying(m.id)}
          onPos={(pos) => {
            if (!GALAXY_CONFIG.DEBUG_ENABLED) return;
            flyingPosRef.current.set(m.id, {
              word: m.word,
              x: pos.x,
              y: pos.y,
              vx: m.vx,
            });
          }}
          onSelect={onSelectWord}
        />
      ))}

      {orbiters.map((o) => (
        <OrbitMeteor key={o.id} orbiter={o} onSelect={onSelectWord} />
      ))}
    </>
  );
}