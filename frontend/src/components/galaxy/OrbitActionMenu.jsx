import { useEffect, useMemo, useRef, useState } from 'react';
import { GALAXY_CONFIG } from '../../config/galaxyConfig';

/*
  clamp
  Small helper used for keeping UI rotation values readable.
*/
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/*
  computeLabelRotateDeg
  Approximates the tangent direction of an orbit at a given phase.
  This is used to give open-state labels a subtle "curved" feel
  while keeping them readable via clamping.
*/
function computeLabelRotateDeg(phaseDeg) {
  const tangentDeg = (Number(phaseDeg) + 90) % 360;
  const normalized = ((tangentDeg + 180) % 360) - 180; // [-180, 180]

  const max = GALAXY_CONFIG.ORBIT_MENU_LABEL_ROTATE_MAX_DEG;
  return clamp(normalized, -max, max);
}

/*
  buildOrbitLayout
  Computes orbit ring, radius, phase, and duration for each visible menu item.

  Notes:
  - Designed to be scalable: items are distributed across multiple rings when needed.
  - Each ring holds up to GALAXY_CONFIG.ORBIT_MENU_MAX_MOONS_PER_RING items.
*/
function buildOrbitLayout(items) {
  const maxPerRing = GALAXY_CONFIG.ORBIT_MENU_MAX_MOONS_PER_RING;
  const minRings = GALAXY_CONFIG.ORBIT_MENU_MIN_RINGS;

  const baseRadius = GALAXY_CONFIG.ORBIT_MENU_ORBIT_RADIUS_PX;
  const ringStep = GALAXY_CONFIG.ORBIT_MENU_RING_RADIUS_STEP_PX;
  const baseDuration = GALAXY_CONFIG.ORBIT_MENU_ORBIT_DURATION_S;
  const durationStep = GALAXY_CONFIG.ORBIT_MENU_ORBIT_DURATION_STEP_S;

  // Ensure multi-ring motion even with a small number of items.
  // For larger menus, add more rings as needed to keep rings from overcrowding.
  const ringsNeeded = Math.ceil(items.length / Math.max(1, maxPerRing));
  const ringCount = Math.min(items.length, Math.max(minRings, ringsNeeded));

  // Distribute items across rings (round-robin) so rings are balanced.
  const ringBuckets = Array.from({ length: ringCount }, () => []);
  items.forEach((item, i) => {
    ringBuckets[i % ringCount].push({ item, originalIndex: i });
  });

  // Build layout entries while preserving the original item order.
  const out = new Array(items.length);

  ringBuckets.forEach((bucket, ring) => {
    const ringSize = bucket.length;
    const radiusPx = baseRadius + ring * ringStep;
    const durationS = baseDuration + ring * durationStep;

    // A small ring-based phase offset keeps rings from visually lining up.
    const ringPhaseOffset = (ring / Math.max(1, ringCount)) * 30;

    bucket.forEach(({ item, originalIndex }, idxInRing) => {
      const phaseDeg = ringSize > 0 ? (idxInRing / ringSize) * 360 + ringPhaseOffset : ringPhaseOffset;
      out[originalIndex] = {
        ...item,
        _orbit: {
          ring,
          phaseDeg,
          radiusPx,
          durationS,
          index: originalIndex,
        },
      };
    });
  });

  return out.filter(Boolean);
}

/*
  OrbitActionMenu
  Bottom-right "planet" menu with orbiting "moons".

  Behavior:
  - Closed: moons orbit around the planet with icons only.
  - Open: moons align vertically above the planet and show labels.

  Props:
  - items: Array of { key, label, icon, onClick, show? }
*/
export default function OrbitActionMenu({ items = [] }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const visibleItems = useMemo(
    () => items.filter((it) => it && it.show !== false),
    [items]
  );

  const layoutItems = useMemo(
    () => buildOrbitLayout(visibleItems),
    [visibleItems]
  );

  // Close menu on Escape for keyboard users.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  // Close menu when clicking outside the menu.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e) => {
      const el = rootRef.current;
      if (!el) return;
      if (el.contains(e.target)) return;
      setOpen(false);
    };

    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const handlePlanetClick = () => {
    setOpen((v) => !v);
  };

  const runItem = async (item) => {
    try {
      await item?.onClick?.();
    } finally {
      setOpen(false);
    }
  };

  // Expose menu sizing through CSS variables so the visuals are easy to tune.
  const rootStyle = {
    '--orbit-menu-corner-offset': `${GALAXY_CONFIG.ORBIT_MENU_CORNER_OFFSET_PX}px`,
    '--orbit-menu-orbit-radius': `${GALAXY_CONFIG.ORBIT_MENU_ORBIT_RADIUS_PX}px`,
    '--orbit-menu-planet-size': `${GALAXY_CONFIG.ORBIT_MENU_PLANET_SIZE_PX}px`,
    '--orbit-menu-moon-size': `${GALAXY_CONFIG.ORBIT_MENU_MOON_SIZE_PX}px`,
    '--orbit-menu-icon-size': `${GALAXY_CONFIG.ORBIT_MENU_ICON_SIZE_PX}px`,
    '--orbit-menu-stack-gap': `${GALAXY_CONFIG.ORBIT_MENU_STACK_GAP_PX}px`,
    '--orbit-menu-label-gap': `${GALAXY_CONFIG.ORBIT_MENU_LABEL_GAP_PX}px`,
  };

  return (
    <div
      ref={rootRef}
      className={open ? 'orbit-menu orbit-menu--open' : 'orbit-menu'}
      style={rootStyle}
      aria-label="Actions"
    >
      {/* Orbiting layer (icons only) */}
      <div className="orbit-menu__orbit-layer" aria-hidden={open ? 'true' : 'false'}>
        {layoutItems.map((it) => (
          <div
            key={it.key}
            className="orbit-menu__orbit-phase"
            style={{ '--orbit-phase': `${it._orbit.phaseDeg}deg` }}
          >
            <div
              className="orbit-menu__orbit-spin"
              style={{ '--orbit-duration': `${it._orbit.durationS}s` }}
            >
              <button
                type="button"
                className="orbit-menu__moon"
                style={{ '--orbit-radius-item': `${it._orbit.radiusPx}px` }}
                onClick={() => runItem(it)}
                aria-label={it.label}
                title={it.label}
              >
                <span className="orbit-menu__moon-icon" aria-hidden="true">
                  {it.icon}
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Stacked layer (labels visible) */}
      <div className="orbit-menu__stack-layer" aria-hidden={open ? 'false' : 'true'}>
        {layoutItems.map((it, i) => (
          <div
            key={it.key}
            className="orbit-menu__stack-item"
            style={{
              '--stack-y': `-${(i + 1) * GALAXY_CONFIG.ORBIT_MENU_STACK_GAP_PX}px`,
              '--label-rotate': `${computeLabelRotateDeg(it._orbit?.phaseDeg)}deg`,
            }}
          >
            <button
              type="button"
              className="orbit-menu__moon orbit-menu__moon--stack"
              onClick={() => runItem(it)}
              aria-label={it.label}
              title={it.label}
            >
              <span className="orbit-menu__moon-icon" aria-hidden="true">
                {it.icon}
              </span>
            </button>

            <span className="orbit-menu__label">{it.label}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="orbit-menu__planet"
        onClick={handlePlanetClick}
        aria-expanded={open}
        aria-label={open ? 'Close menu' : 'Open menu'}
        title={open ? 'Close menu' : 'Open menu'}
      >
        <span className="orbit-menu__planet-core" aria-hidden="true" />
      </button>
    </div>
  );
}