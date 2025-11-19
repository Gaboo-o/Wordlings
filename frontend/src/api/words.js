import axios from "axios";
import { csrfHeader } from "./_csrf";

export const fetchTrends = async (word) =>
  (await axios.get(`/api/trends/${encodeURIComponent(word)}`)).data;

export const fetchWords = async (params = {}) =>
  (await axios.get("/api/words", { params })).data;

export const fetchWordById = async (id) =>
  (await axios.get(`/api/words/${id}`)).data;

export const searchWords = async (searchTerm) =>
  (await axios.get("/api/words/search", { params: { search: searchTerm } }))
    .data;

export const addWord = async ({ word, definition, examples }) =>
  (
    await axios.post(
      "/api/words/add",
      { word, definition, examples },
      { withCredentials: true, headers: csrfHeader() }
    )
  ).data;

export const upvoteWord = async (id) =>
  (
    await axios.post(
      `/api/words/upvote/${id}`,
      {},
      { withCredentials: true, headers: csrfHeader() }
    )
  ).data;

export const fetchSimilar = async ({ wordId, word, limit = 12 }) => {
  const params = {};
  if (wordId) params.word_id = wordId;
  if (word) params.word = word;
  params.limit = limit;
  const res = await axios.get("/api/words/similar", { params });
  return res.data;
};
