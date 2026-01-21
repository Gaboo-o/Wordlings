import { useEffect, useRef } from 'react';

/*
  FlyingMeteor
  Animates a single meteor label moving horizontally across the screen.

  Contract:
  - Calls `onDone()` once the meteor moves out of bounds.
  - Calls `onPos({x,y})` each frame if provided (intended for debugging only).
  - Calls `onSelect(meteor)` when clicked.
*/
export default function FlyingMeteor({
  meteor,
  pausedRef,
  despawnMarginPx,
  onDone,
  onPos,
  onSelect,
}) {
  const ref = useRef(null);
  const pos = useRef({ x: meteor.x, y: meteor.y });

  useEffect(() => {
    let rafId;

    const tick = () => {
      // Crucial: avoid advancing animation while the tab is hidden.
      if (!pausedRef.current && ref.current) {
        pos.current.x += meteor.vx;

        ref.current.style.left = `${pos.current.x}px`;
        ref.current.style.top = `${pos.current.y}px`;

        // Optional callback for debug sampling.
        onPos?.(pos.current);

        // Despawn once sufficiently off-screen.
        const leftBound = -despawnMarginPx;
        const rightBound = window.innerWidth + despawnMarginPx;
        if (pos.current.x < leftBound || pos.current.x > rightBound) {
          onDone?.();
          return;
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [despawnMarginPx, meteor.vx, onDone, onPos, pausedRef]);

  return (
    <div
      ref={ref}
      className="meteor"
      style={{ position: 'absolute', left: meteor.x, top: meteor.y }}
      onClick={() => onSelect?.(meteor)}
      title={`id=${meteor.wordId}`}
    >
      {meteor.word}
    </div>
  );
}
