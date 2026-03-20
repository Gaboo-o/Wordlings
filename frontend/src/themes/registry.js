export const THEME_STORAGE_KEY = 'wordlings.theme';

export const THEMES = [
  {
    id: 'default',
    label: 'Default',
  },
  {
    id: 'pumpkin',
    label: 'Pumpkin',
  },
];

export const DEFAULT_THEME_ID = 'default';

export function isValidThemeId(id) {
  return THEMES.some((t) => t.id === id);
}
