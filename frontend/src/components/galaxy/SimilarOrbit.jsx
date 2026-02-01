import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

/*
  SimilarOrbit
  Renders a center "planet" label and places similar words around orbit rings.

  Props:
  - centerWord: string
  - items: [{ id, word, score? }] score can be 0..1 (higher = more similar). If absent, it's treated as medium.
  - sizePx: number (square container size)
*/
export default function SimilarOrbit({ centerWord, items = [], sizePx = 360 }) {
  const navigate = useNavigate();

  const safeItems = Array.isArray(items) ? items : [];

  // Normalize scores to [0,1] defensively.
  const normalized = useMemo(() => {
    const scores = safeItems.map((x) => (typeof x.score === 'number' ? x.score : 0.5));
    const min = Math.min(...scores, 0);
    const max = Math.max(...scores, 1);
    const denom = max - min || 1;

    return safeItems.map((x, i) => {
      const raw = typeof x.score === 'number' ? x.score : 0.5;
      const s = (raw - min) / denom; // 0..1
      return { ...x, _s: Math.max(0, Math.min(1, s)), _i: i };
    });
  }, [safeItems]);

  // Split into rings by similarity: inner ring = most similar
  const rings = useMemo(() => {
    const inner = [];
    const mid = [];
    const outer = [];

    normalized.forEach((x) => {
      if (x._s >= 0.67) inner.push(x);
      else if (x._s >= 0.34) mid.push(x);
      else outer.push(x);
    });

    return [inner, mid, outer].filter((r) => r.length);
  }, [normalized]);

  // Radii for rings (in px) relative to container
  const radii = useMemo(() => {
    // Fits well for 320–420 sizes; scales with container
    const base = sizePx * 0.18; // first ring distance from center
    const step = sizePx * 0.13; // distance between rings
    return rings.map((_, idx) => Math.round(base + idx * step));
  }, [rings, sizePx]);

  const onSelect = (id) => {
    if (!id) return;
    navigate(`/word/${id}`);
  };

  return (
    <div className="similar-orbit" style={{ width: sizePx, height: sizePx }}>
      {/* Orbit lines */}
      {radii.map((r, idx) => (
        <div
          key={`ring-${idx}`}
          className="similar-orbit__ring"
          style={{
            width: r * 2,
            height: r * 2,
          }}
          aria-hidden="true"
        />
      ))}

      {/* Center planet */}
      <button
        type="button"
        className="similar-orbit__planet"
        onClick={() => {}}
        aria-label={centerWord}
        title={centerWord}
      >
        {centerWord}
      </button>

      {/* Orbiting word nodes */}
      {rings.map((ringItems, ringIdx) => {
        const r = radii[ringIdx] || 120;
        const n = ringItems.length || 1;

        return ringItems.map((it, i) => {
          // Spread evenly around the circle; add a ring offset so rings don't line up.
          const offsetDeg = ringIdx * 18;
          const angle = ((i / n) * 360 + offsetDeg) * (Math.PI / 180);

          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;

          return (
            <button
              key={it.id}
              type="button"
              className="similar-orbit__node"
              style={{
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
              }}
              onClick={() => onSelect(it.id)}
              title={typeof it.score === 'number' ? `similarity: ${it.score}` : it.word}
              aria-label={it.word}
            >
              {it.word}
            </button>
          );
        });
      })}
    </div>
  );
}
