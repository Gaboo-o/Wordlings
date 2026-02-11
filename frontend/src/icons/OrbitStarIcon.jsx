export default function OrbitStarIcon({ size = 28 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
    >
      {/* Star shape */}
      <polygon
        points="
          32 6
          38 24
          58 24
          42 36
          48 56
          32 44
          16 56
          22 36
          6 24
          26 24
        "
        fill="#FFD86B"
        stroke="#111"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Inner glow highlight */}
      <polygon
        points="
          32 14
          36 26
          48 26
          38 34
          42 46
          32 38
          22 46
          26 34
          16 26
          28 26
        "
        fill="rgba(255,255,255,0.35)"
      />
    </svg>
  );
}
