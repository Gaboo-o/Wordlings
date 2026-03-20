// frontend/src/api/client.js
import axios from "axios";
import { ApiError, normalizeAxiosError } from "./errors";
import { getCsrfToken } from "./csrf";

/**
 * Central axios client
 * - baseURL: uses Vite proxy in dev by default (same-origin "/api")
 * - withCredentials: ensure session cookies flow
 * - CSRF header: auto for unsafe methods
 * - error normalization: throws ApiError
 */

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  withCredentials: true,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
  },
});

let onUnauthorized = null;

/** Allow AuthContext to register a handler for 401s. */
export function setUnauthorizedHandler(fn) {
  onUnauthorized = typeof fn === "function" ? fn : null;
}

api.interceptors.request.use((config) => {
  const method = (config.method || "get").toLowerCase();
  const unsafe = ["post", "put", "patch", "delete"].includes(method);

  if (unsafe) {
    const token = getCsrfToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers["X-CSRFToken"] = token;
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    // Defensive: if we got HTML, something is wrong (proxy/baseURL/redirect)
    const ct = String(response?.headers?.["content-type"] || "").toLowerCase();
    if (ct.includes("text/html")) {
      throw new ApiError(
        "Unexpected HTML response from API. Check Vite proxy / API base URL and Flask route trailing slashes.",
        {
          status: response.status || 0,
          code: "BAD_API_RESPONSE",
          details: { contentType: ct, url: response?.config?.url },
        }
      );
    }

    // Backward-compatible unwrapping:
    // - If backend returns { success, data } (new style), return data
    // - Otherwise return raw response.data
    const body = response.data;
    if (body && typeof body === "object" && body.success === true && "data" in body) {
      return { ...response, data: body.data };
    }
    return response;
  },
  (err) => {
    const normalized = normalizeAxiosError(err);

    if (normalized.status === 401 && onUnauthorized) {
      try {
        onUnauthorized(normalized);
      } catch {
        // no-op
      }
    }

    return Promise.reject(normalized);
  }
);

// Convenience wrappers that return response.data
export async function get(url, config = {}) {
  const res = await api.get(url, config);
  return res.data;
}
export async function post(url, data, config = {}) {
  const res = await api.post(url, data, config);
  return res.data;
}
export async function put(url, data, config = {}) {
  const res = await api.put(url, data, config);
  return res.data;
}
export async function patch(url, data, config = {}) {
  const res = await api.patch(url, data, config);
  return res.data;
}
export async function del(url, config = {}) {
  const res = await api.delete(url, config);
  return res.data;
}

export default api;