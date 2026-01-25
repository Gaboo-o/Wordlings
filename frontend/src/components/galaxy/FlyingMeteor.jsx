import { useEffect, useMemo, useRef } from 'react';

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

  // Direction is used only for styling (trail direction, ship orientation).
  const dir = meteor.vx >= 0 ? 'right' : 'left';

  const rootClassName = useMemo(() => {
    const base = 'fly-item';
    const dirClass = dir === 'right' ? 'fly-item--right' : 'fly-item--left';
    return `${base} ${dirClass}`;
  }, [dir]);

  const objectClassName = meteor.variant === 'ship'
    ? 'fly-object fly-object--ship'
    : 'fly-object fly-object--meteor';

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

  // Use a button for a reliable, clickable hitbox.
  // Styling removes default button appearance.
  return (
    <button
      type="button"
      ref={ref}
      className={rootClassName}
      style={{
        left: meteor.x,
        top: meteor.y,
        '--fly-size': `${Number(meteor.sizePx) || 24}px`,
      }}
      onClick={() => onSelect?.(meteor)}
      aria-label={meteor.word}
      title={`id=${meteor.wordId}`}
    >
      <span className={objectClassName} aria-hidden="true" />
      <span className="fly-label">{meteor.word}</span>
    </button>
  );
}