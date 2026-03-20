/**
 * Cross-browser id generation.
 *
 * crypto.randomUUID is supported in modern browsers, but we provide a safe fallback
 * to avoid hard crashes in older environments.
 */
export function createId(prefix = 'id') {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `${prefix}_${crypto.randomUUID()}`;
    }
  } catch {
    // ignore
  }

  // Fallback: time + random
  const rand = Math.random().toString(16).slice(2);
  const time = Date.now().toString(16);
  return `${prefix}_${time}_${rand}`;
}
