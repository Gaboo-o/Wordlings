// Theme CSS is imported once at app startup.
// Switching themes is done by setting `document.documentElement.dataset.theme`.

import './default/tokens.css';
import './default/variants.css';

import './pumpkin/tokens.css';
import './pumpkin/variants.css';

export { THEMES, DEFAULT_THEME_ID, THEME_STORAGE_KEY, isValidThemeId } from './registry';
