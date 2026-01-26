import axios from "axios";

export const fetchTrends = async (word) => {
  try {
    const res = await axios.get(`/api/trends/${encodeURIComponent(word)}`);
    const data = res.data || {};

    const raw = Array.isArray(data.trend) ? data.trend : [];

    // Normalize into {date, value} for Recharts no matter what backend sends
    const trend = raw
      .map((pt) => {
        const date =
          pt.date ||
          pt.time ||
          pt.formattedTime ||
          pt.formatted_time ||
          pt.week ||
          null;

        const value =
          pt.value ??
          pt.interest ??
          pt.score ??
          pt.count ??
          null;

        if (!date || value === null || value === undefined) return null;

        return { date: String(date), value: Number(value) };
      })
      .filter(Boolean);

    return {
      trend,
      topRegion: data.topRegion ?? data.top_region ?? null,
    };
  } catch (e) {
    console.error("fetchTrends failed:", e?.response?.status, e?.response?.data || e);
    return { trend: [], topRegion: null };
  }
};


export const fetchWords = async (params = {}) => {
  try {
    const res = await axios.get("/api/words", { params });
    return res.data;
  } catch (e) {
    console.error("fetchWords failed:", e?.response?.status, e?.response?.data || e);
    return [];
  }
};

export const fetchWordById = async (id) => {
  try {
    const res = await axios.get(`/api/words/${id}`);
    return res.data;
  } catch (e) {
    console.error("fetchWordById failed:", e?.response?.status, e?.response?.data || e);
    return null;
  }
};

export const searchWords = async (searchTerm) => {
  try {
    const res = await axios.get("/api/words/search", {
      params: { search: searchTerm }
    });
    return res.data;
  } catch (e) {
    console.error("searchWords failed:", e?.response?.status, e?.response?.data || e);
    return [];
  }
};

export const addWord = async ({ word, definition, examples }) => {
  try {
    const res = await axios.post(
      "/api/words/add",
      { word, definition, examples },
      { headers: { "X-CSRF-Token": document.cookie.split("; ").find(c => c.startsWith("X-CSRF-Token="))?.split("=")[1] || "" }, withCredentials: true }
    );
    return res.data;
  } catch (e) {
    console.error("addWord failed:", e?.response?.status, e?.response?.data || e);
    throw e;
  }
};

export const upvoteWord = async (id) => {
  try {
    const token = document.cookie.split("; ").find(c => c.startsWith("X-CSRF-Token="))?.split("=")[1] || "";
    const res = await axios.post(
      `/api/words/upvote/${id}`,
      {},
      { headers: { "X-CSRF-Token": token }, withCredentials: true }
    );
    return res.data; // { upvotes, user_has_upvoted }
  } catch (e) {
    console.error("upvoteWord failed:", e?.response?.status, e?.response?.data || e);
    throw e;
  }
};

export const fetchSubmissions = async () => {
  try {
    const res = await axios.get("/api/words/submissions", { withCredentials: true });
    return Array.isArray(res.data) ? res.data : [];
  } catch (e) {
    console.error("fetchSubmissions failed:", e?.response?.status, e?.response?.data || e);
    return [];
  }
};

export const fetchSimilar = async ({ wordId, limit = 12 }) => {
  try {
    const res = await axios.get("/api/words/similar", {
      params: { word_id: wordId, limit },
    });
    return Array.isArray(res.data) ? res.data : [];
  } catch (e) {
    console.error("fetchSimilar failed:", e?.response?.status, e?.response?.data || e);
    return [];
  }
};
