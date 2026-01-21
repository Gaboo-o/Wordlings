/*
  galaxyConfig
  Central configuration for the galaxy UI.

  Goals:
  - Keep all tunable values in one place.
  - Avoid magic numbers scattered across components.
  - Make it easy to disable debugging globally.
*/

export const GALAXY_CONFIG = {
  // Debug
  DEBUG_ENABLED: true,
  DEBUG_SAMPLE_FLYING_COUNT: 6,

  // Search behavior
  SEARCH_DELAY_MS: 700,
  SEARCH_MAX_RESULTS: 10,
  SEARCH_MIN_QUERY_LEN: 2,

  // Match scoring
  MATCH_SCORE_EXACT: 1.0,
  MATCH_SCORE_STARTS_WITH: 0.85,
  MATCH_SCORE_INCLUDES: 0.55,

  // Flying meteor spawning
  FLY_SPAWN_INTERVAL_MS: 800,
  FLY_SPAWN_X_MARGIN_PX: 200,
  FLY_SPAWN_Y_MAX_RATIO: 0.8,

  // Flying meteor movement
  FLY_SPEED_PX_PER_FRAME: 2,
  FLY_DESPAWN_MARGIN_PX: 260,

  // Orbit animation
  ORBIT_CENTER_LEFT: '50%',
  ORBIT_CENTER_TOP: '50%',
  ORBIT_ANGULAR_SPEED_PER_FRAME: 0.004,

  // Orbit radius mapping (closest matches closer)
  ORBIT_RADIUS_MIN_PX: 80,
  ORBIT_RADIUS_MATCH_SPREAD_PX: 140,
  ORBIT_RADIUS_INDEX_STEP_PX: 10,
};

// Non-tunable math helpers.
export const TWO_PI = Math.PI * 2;
