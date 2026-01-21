import { GALAXY_CONFIG } from '../../config/galaxyConfig';

/*
  DebugOverlay
  Renders a fixed debug panel in the bottom-left corner.

  Debugging is globally controlled by GALAXY_CONFIG.DEBUG_ENABLED.
  When disabled, the component renders null and no debug-only work should be done elsewhere.
*/
export default function DebugOverlay({ data }) {
  if (!GALAXY_CONFIG.DEBUG_ENABLED) return null;
  if (!data) return null;

  const {
    mode,
    query,
    debouncedQuery,
    flyingCount,
    results,
    sampleFlying,
  } = data;

  const safeResults = Array.isArray(results) ? results : [];
  const safeSamples = Array.isArray(sampleFlying) ? sampleFlying : [];

  return (
    <div className="debug-overlay">
      <div className="debug-title">DEBUG</div>

      <div>mode: {mode}</div>
      <div>query: "{query}"</div>
      <div>debounced: "{debouncedQuery}"</div>
      <div>flying: {flyingCount}</div>
      <div>results: {safeResults.length}</div>
      <div>hidden(tab): {String(document.hidden)}</div>

      <div className="debug-section">
        <div className="debug-section-title">results</div>
        <pre className="debug-pre">
          {safeResults.length
            ? safeResults
                .map((r, i) => `${i + 1}. ${r.word} (s=${Number(r.s).toFixed(2)})`)
                .join('\n')
            : '(none)'}
        </pre>
      </div>

      <div className="debug-section">
        <div className="debug-section-title">flying samples</div>
        <pre className="debug-pre">
          {safeSamples.length
            ? safeSamples
                .map((m, i) => (
                  `${i + 1}. ${m.word} x=${Math.round(m.x)} y=${Math.round(m.y)} vx=${m.vx}`
                ))
                .join('\n')
            : '(none)'}
        </pre>
      </div>
    </div>
  );
}
