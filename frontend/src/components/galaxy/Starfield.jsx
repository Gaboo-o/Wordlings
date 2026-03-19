import { useMemo } from 'react';

export default function Starfield({ count = 180, width = 1600, height = 900 }) {
  const stars = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const cx = Math.random() * width;
      const cy = Math.random() * height;
      const r = Math.random() < 0.85 ? 1 : Math.random() < 0.95 ? 1.5 : 2.2;
      const opacity = 0.45 + Math.random() * 0.5;

      return { id: i, cx, cy, r, opacity };
    });
  }, [count, width, height]);

  return (
    <svg
      className="starfield"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {stars.map((s) => (
        <circle
          key={s.id}
          cx={s.cx}
          cy={s.cy}
          r={s.r}
          fill="white"
          opacity={s.opacity}
        />
      ))}
    </svg>
  );
}