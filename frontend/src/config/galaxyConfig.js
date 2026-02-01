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
  FLY_SPAWN_INTERVAL_MS: 1600,
  FLY_SPAWN_X_MARGIN_PX: 200,
  FLY_SPAWN_Y_MAX_RATIO: 0.8,

  // Flying meteor movement
  FLY_SPEED_PX_PER_FRAME: 2,
  FLY_DESPAWN_MARGIN_PX: 260,

  // Flying meteor visuals
  // Size scales with upvotes using a clamped logarithmic curve.
  FLY_SIZE_MIN_PX: 18,
  FLY_SIZE_MAX_PX: 46,
  FLY_SIZE_LOG_MULT: 5,

  // Flying meteor visual variants
  // The top N words by upvotes are rendered as ships.
  FLY_SHIP_TOP_N: 10,

  // Orbit animation
  ORBIT_CENTER_LEFT: '50%',
  ORBIT_CENTER_TOP: '50%',
  ORBIT_ANGULAR_SPEED_PER_FRAME: 0.004,

  // Orbit radius mapping (closest matches closer)
  ORBIT_RADIUS_MIN_PX: 80,
  ORBIT_RADIUS_MATCH_SPREAD_PX: 140,
  ORBIT_RADIUS_INDEX_STEP_PX: 10,


  // Home hero text
  HOME_APP_NAME: 'Wordlings',
  HOME_TAGLINE: 'Words out of this world.',
  HOME_SEARCH_PLACEHOLDER: 'Search words...',

  // Orbit action menu (planet + moons)
  ORBIT_MENU_CORNER_OFFSET_PX: 32,
  ORBIT_MENU_ORBIT_RADIUS_PX: 120,
  ORBIT_MENU_PLANET_SIZE_PX: 66,
  ORBIT_MENU_MOON_SIZE_PX: 44,
  ORBIT_MENU_ICON_SIZE_PX: 18,
  ORBIT_MENU_ORBIT_DURATION_S: 10,
  ORBIT_MENU_ORBIT_DURATION_STEP_S: 2,
  ORBIT_MENU_MAX_MOONS_PER_RING: 6,
  ORBIT_MENU_MIN_RINGS: 2,
  ORBIT_MENU_RING_RADIUS_STEP_PX: 26,
  ORBIT_MENU_STACK_GAP_PX: 56,
  ORBIT_MENU_LABEL_GAP_PX: 12,
  ORBIT_MENU_LABEL_ROTATE_MAX_DEG: 18,

};

// Non-tunable math helpers.
export const TWO_PI = Math.PI * 2;