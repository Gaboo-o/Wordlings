import { useEffect, useRef } from 'react';
import { GALAXY_CONFIG } from '../../config/galaxyConfig';

/*
  OrbitMeteor
  Animates a label orbiting around a fixed center point.

  Contract:
  - Calls `onSelect(orbiter)` when clicked.
  - Uses requestAnimationFrame for smooth animation.
*/
export default function OrbitMeteor({ orbiter, onSelect }) {
  const ref = useRef(null);

  useEffect(() => {
    let a = orbiter.angle;
    let rafId;

    const tick = () => {
      a += GALAXY_CONFIG.ORBIT_ANGULAR_SPEED_PER_FRAME;

      const x = Math.cos(a) * orbiter.radius;
      const y = Math.sin(a) * orbiter.radius;

      if (ref.current) {
        // Crucial: orbiting is done by anchoring at the center and translating relative to it.
        ref.current.style.left = GALAXY_CONFIG.ORBIT_CENTER_LEFT;
        ref.current.style.top = GALAXY_CONFIG.ORBIT_CENTER_TOP;
        ref.current.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [orbiter.angle, orbiter.radius]);

  return (
    <div
      ref={ref}
      className="orbit-star"
      style={{ position: "absolute" }}
      onClick={() => onSelect?.(orbiter)}
      title={`id=${orbiter.wordId} score=${Number(orbiter.score).toFixed(2)}`}
  >
    <span className="orbit-star__dot" aria-hidden="true" />
    <span className="orbit-star__label">{orbiter.word}</span>
  </div>
  );
}
