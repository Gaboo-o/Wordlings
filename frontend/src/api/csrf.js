/**
 * CSRF helpers.
 *
 * Backend sets a cookie named `X-CSRF-Token`.
 * The frontend must send the same value in an `X-CSRF-Token` header for unsafe requests.
 */

export const CSRF_COOKIE_NAME = 'X-CSRF-Token';

function readCookie(name) {
  if (typeof document === 'undefined') return null;
  const raw = document.cookie
    ?.split('; ')
    ?.find((c) => c.startsWith(`${name}=`));
  if (!raw) return null;
  const value = raw.split('=').slice(1).join('=');
  return value ? decodeURIComponent(value) : null;
}

export function getCsrfToken() {
  return readCookie(CSRF_COOKIE_NAME);
}

export function csrfHeader() {
  const token = getCsrfToken();
  return token ? { 'X-CSRF-Token': token } : {};
}