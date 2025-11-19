import { motion } from "framer-motion";
import { useMemo } from "react";
import "../style/FloatingSimilar.css";


function polarToCartesian(r, angleDeg) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: r * Math.cos(a), y: r * Math.sin(a) };
}

export default function FloatingSimilar({ centerWord, items, onClick }) {
  // Spread items around in concentric rings, randomize a bit
  const layout = useMemo(() => {
    const ringRadii = [80, 130, 180]; // px from center
    const placed = [];
    let i = 0;
    items.slice(0, 18).forEach((item, idx) => {
      const ring = ringRadii[idx % ringRadii.length];
      const angle = (idx * (360 / Math.min(items.length, 12))) + (idx * 7 % 30);
      const { x, y } = polarToCartesian(ring, angle);
      placed.push({ ...item, x, y, delay: (idx % 6) * 0.15, duration: 10 + (idx % 5) });
      i++;
    });
    return placed;
  }, [items]);

  return (
        <div className="floating-container">
    <div className="floating-center">{centerWord}</div>

    <svg className="floating-rings" viewBox="-210 -210 420 420">
        {[80,130,180].map((r, i) => (
        <circle key={i} cx="0" cy="0" r={r} className="floating-ring" />
        ))}
    </svg>

    {/* each button already uses absolute positioning via .floating-node */}
    </div>

  );
}
