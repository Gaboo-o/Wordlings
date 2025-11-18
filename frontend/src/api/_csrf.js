export function csrfHeader() {
  const token = document.cookie.split('; ').find(r => r.startsWith('X-CSRF-Token='))?.split('=')[1];
  return token ? { 'X-CSRF-Token': decodeURIComponent(token) } : {};
}
