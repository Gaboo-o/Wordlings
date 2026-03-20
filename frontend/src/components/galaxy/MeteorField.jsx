// frontend/src/components/galaxy/MeteorField.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useDebouncedValue from "../../hooks/useDebouncedValue";
import { GALAXY_CONFIG, TWO_PI } from "../../config/galaxyConfig";
import DebugOverlay from "../debug/DebugOverlay";
import FlyingMeteor from "./FlyingMeteor";
import OrbitMeteor from "./OrbitMeteor";

/** Accept various id keys defensively */
function getWordId(w) {
  const v = w?.id ?? w?.word_id ?? w?.wordId;
  // allow numeric strings too
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
}

function getWordText(w) {
  const v = w?.word ?? w?.text ?? w?.name;
  return typeof v === "string" ? v : "";
}

function matchStrength(word, query) {
  const w = (word || "").toLowerCase();
  const q = (query || "").toLowerCase();

  if (!q) return 0;
  if (w === q) return GALAXY_CONFIG.MATCH_SCORE_EXACT;
  if (w.startsWith(q)) return GALAXY_CONFIG.MATCH_SCORE_STARTS_WITH;
  if (w.includes(q)) return GALAXY_CONFIG.MATCH_SCORE_INCLUDES;
  return 0;
}

function computeSearchResults(words, debouncedQuery) {
  if (!debouncedQuery || debouncedQuery.length < GALAXY_CONFIG.SEARCH_MIN_QUERY_LEN) {
    return [];
  }

  return words
    .map((w) => {
      const id = getWordId(w);
      const word = getWordText(w);
      return { id, word, s: matchStrength(word, debouncedQuery) };
    })
    .filter((x) => x.s > 0 && x.word)
    .sort((a, b) => b.s - a.s)
    .slice(0, GALAXY_CONFIG.SEARCH_MAX_RESULTS);
}

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
      id: it.id ?? `${it.word}-${i}`, // stable key even if id missing
      wordId: it.id ?? null,
      word: it.word,
      score: it.s,
      radius,
      angle,
    };
  });
}

function computeFlySizePx(upvotes) {
  const v = Math.max(0, Number(upvotes) || 0);
  const raw = GALAXY_CONFIG.FLY_SIZE_MIN_PX + Math.log2(v + 1) * GALAXY_CONFIG.FLY_SIZE_LOG_MULT;
  return Math.min(GALAXY_CONFIG.FLY_SIZE_MAX_PX, Math.max(GALAXY_CONFIG.FLY_SIZE_MIN_PX, raw));
}

export default function MeteorField({ words = [], query = "" }) {
  const navigate = useNavigate();

  const [flying, setFlying] = useState([]);
  const pausedRef = useRef(false);

  const flyingPosRef = useRef(new Map()); // id -> { word, x, y, vx }
  const debouncedQuery = useDebouncedValue(query, GALAXY_CONFIG.SEARCH_DELAY_MS);

  const shipWordIds = useMemo(() => {
    const topN = Math.max(0, GALAXY_CONFIG.FLY_SHIP_TOP_N);
    if (!topN || !words.length) return new Set();

    const sorted = [...words].sort(
      (a, b) => (Number(b?.upvotes) || 0) - (Number(a?.upvotes) || 0)
    );

    return new Set(
      sorted
        .map((w) => getWordId(w))
        .filter((id) => typeof id === "number" && Number.isFinite(id))
        .slice(0, topN)
    );
  }, [words]);

  const results = useMemo(() => computeSearchResults(words, debouncedQuery), [words, debouncedQuery]);
  const orbiters = useMemo(() => buildOrbiters(results), [results]);

  const mode =
    query && query.length >= GALAXY_CONFIG.SEARCH_MIN_QUERY_LEN
      ? debouncedQuery === query
        ? "SEARCH_ACTIVE"
        : "SEARCH_PENDING"
      : "FLYING";

  useEffect(() => {
    const onVis = () => {
      pausedRef.current = document.hidden;
    };

    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    const spawnInterval = window.setInterval(() => {
      if (pausedRef.current) return;
      if (!words.length) return;

      const fromLeft = Math.random() > 0.5;
      const w = words[Math.floor(Math.random() * words.length)];

      const wordId = getWordId(w);
      const wordText = getWordText(w);
      if (!wordText) return;

      const x = fromLeft
        ? -GALAXY_CONFIG.FLY_SPAWN_X_MARGIN_PX
        : window.innerWidth + GALAXY_CONFIG.FLY_SPAWN_X_MARGIN_PX;

      const y = Math.random() * (window.innerHeight * GALAXY_CONFIG.FLY_SPAWN_Y_MAX_RATIO);

      const vx = fromLeft ? GALAXY_CONFIG.FLY_SPEED_PX_PER_FRAME : -GALAXY_CONFIG.FLY_SPEED_PX_PER_FRAME;

      const upvotes = Number(w?.upvotes) || 0;
      const sizePx = computeFlySizePx(upvotes);
      const variant = wordId != null && shipWordIds.has(wordId) ? "ship" : "meteor";

      setFlying((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          wordId: wordId, // may be null
          word: wordText,
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
    const id = item?.wordId ?? item?.id;
    const word = item?.word;

    if (id != null && id !== undefined && id !== "") {
      navigate(`/word/${id}`);
      return;
    }
    if (word) {
      navigate(`/word/${encodeURIComponent(word)}`);
    }
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
    ? { mode, query, debouncedQuery, flyingCount: flying.length, results, sampleFlying }
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
            flyingPosRef.current.set(m.id, { word: m.word, x: pos.x, y: pos.y, vx: m.vx });
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