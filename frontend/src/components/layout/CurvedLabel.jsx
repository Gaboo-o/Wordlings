import React, { useMemo } from "react";

/*
  CurvedLabel
  Renders `text` along a circular arc using an SVG <textPath>.
  Simple, small, and intended as a drop-in replacement for flat labels.

  Props:
    - text (string) : the label text
    - radius (number) : radius in px (distance of arc from center)
    - arcDeg (number) : total arc angle in degrees (how "curvy" the text is)
    - clockwise (bool) : direction of the arc; true = clockwise
    - fontSize (number) : font size in px (default 12)
    - idSuffix (string) : optional suffix to make path id unique
*/
export default function CurvedLabel({
  text = "",
  radius = 100,
  arcDeg = 60,
  clockwise = true,
  fontSize = 12,
  idSuffix = "",
  className = "",
}) {
  // Unique-ish id for the path (sufficient for in-page uniqueness).
  const pathId = useMemo(() => `curved-${Math.random().toString(36).slice(2, 9)}${idSuffix ? "-" + idSuffix : ""}`, [idSuffix]);

  // Clamp arc and compute start/end angles centered around 0 deg.
  const arc = Math.max(8, Math.min(160, Math.abs(arcDeg)));
  const half = arc / 2;
  const startDeg = -half + 270;
  const endDeg = half + 270;
  const sweepFlag = clockwise ? 1 : 0;

  // Convert polar coordinates (r, angleDeg) -> cartesian (x,y)
  const polarToCartesian = (r, angleDeg) => {
    // shift by -90 to make 0deg at (1,0) like typical trig circle mapping
    const a = ((angleDeg - 90) * Math.PI) / 180.0;
    return {
      x: +(r * Math.cos(a)).toFixed(3),
      y: +(r * Math.sin(a)).toFixed(3),
    };
  };

  const d = useMemo(() => {
    const start = polarToCartesian(radius, startDeg);
    const end = polarToCartesian(radius, endDeg);
    const largeArcFlag = arc > 180 ? 1 : 0;
    // 'A rx ry x-axis-rotation large-arc-flag sweep-flag x y'
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
  }, [radius, startDeg, endDeg, arc, sweepFlag]);

  // Naive font-size clamp for very long labels (keeps text from overflowing too much)
  const adjFontSize = Math.max(9, Math.min(fontSize, Math.round(fontSize * (Math.max(8, 20) / Math.max(8, text.length)))));

  return (
    <svg
      className={`curved-label-svg ${className}`}
      width={Math.ceil(radius * 2)}
      height={Math.ceil(radius * 2)}
      viewBox={`${-radius} ${-radius} ${radius * 2} ${radius * 2}`}
      style={{ overflow: "visible", pointerEvents: "none" }}
      aria-hidden="true"
    >
      <defs>
        <path id={pathId} d={d} fill="none" />
      </defs>

      <text
        fontSize={adjFontSize}
        fontFamily="inherit"
        fill="currentColor"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        <textPath href={`#${pathId}`} startOffset="50%">
          {text}
        </textPath>
      </text>
    </svg>
  );
}
