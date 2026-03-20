import { get } from './client';

/**
 * Fetch Google Trends-like data for a word.
 *
 * Response shapes seen historically:
 * - { trend: [{date,value}, ...], topRegion }
 * - backend wrappers: { success: true, data: { ... } }
 */
export async function fetchTrends(word, { signal } = {}) {
  const data = await get(`/api/trends/${encodeURIComponent(word)}`, { signal });

  const raw = Array.isArray(data?.trend) ? data.trend : [];

  // Normalize into {date, value} for Recharts no matter what backend sends.
  const trend = raw
    .map((pt) => {
      const date =
        pt.date ||
        pt.time ||
        pt.formattedTime ||
        pt.formatted_time ||
        pt.week ||
        null;

      const value = pt.value ?? pt.interest ?? pt.score ?? pt.count ?? null;

      if (!date || value === null || value === undefined) return null;

      return { date: String(date), value: Number(value) };
    })
    .filter(Boolean);

  return {
    trend,
    topRegion: data?.topRegion ?? data?.top_region ?? null,
  };
}