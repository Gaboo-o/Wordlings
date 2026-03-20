// frontend/src/api/words.js
import { get, post } from "./client";

/**
 * Words API module (HTTP only, no UI logic)
 *
 * Notes:
 * - Keep signatures backward compatible (string arg OR object arg).
 * - Use trailing slash for list endpoint to avoid Flask redirect edge cases.
 */

export function fetchWords({ sort = "alphabetical", signal } = {}) {
  return get(`/api/words/`, { params: { sort }, signal });
}

/**
 * Backward compatible:
 * - searchWords("foo")
 * - searchWords({ query: "foo", signal })
 */
export function searchWords(arg, maybeSignal) {
  let query = "";
  let signal = undefined;

  if (typeof arg === "string") {
    query = arg;
    signal = maybeSignal;
  } else if (arg && typeof arg === "object") {
    query = arg.query ?? "";
    signal = arg.signal;
  }

  return get(`/api/words/search`, { params: { search: query }, signal });
}

export function fetchWordById(id, config = {}) {
  return get(`/api/words/${id}`, config);
}

export function fetchWordByText(word, config = {}) {
  return get(`/api/words/${encodeURIComponent(word)}`, config);
}

export function fetchWordByTextWithTrends(word, { includeTrends = false, signal } = {}) {
  return get(`/api/words/${encodeURIComponent(word)}`, {
    params: { includeTrends: includeTrends ? "true" : "false" },
    signal,
  });
}

export function addWord({ word, definition, examples, signal } = {}) {
  return post(`/api/words/add`, { word, definition, examples }, { signal });
}

export function upvoteWord({ id, signal } = {}) {
  return post(`/api/words/upvote/${id}`, null, { signal });
}

export function fetchSubmissions({ signal } = {}) {
  return get(`/api/words/submissions`, { signal });
}

export function fetchSimilar({ wordId, limit = 12, signal } = {}) {
  return get(`/api/words/similar`, {
    params: { word_id: wordId, limit },
    signal,
  });
}