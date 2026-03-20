import axios from 'axios';

/**
 * Normalized API error shape.
 *
 * - `message`: human-readable error
 * - `status`: HTTP status when available
 * - `code`: application-specific code when available
 * - `details`: optional server-provided metadata
 */
export class ApiError extends Error {
  constructor(message, { status = 0, code = undefined, details = undefined } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function isApiError(err) {
  return err instanceof ApiError;
}

export function getErrorMessage(err, fallback = 'Something went wrong') {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  if (err instanceof ApiError) return err.message || fallback;
  if (err instanceof Error) return err.message || fallback;
  return fallback;
}

/**
 * Converts an Axios error (or any thrown value) into ApiError.
 *
 * Important: This should be used at the network boundary only.
 */
export function normalizeAxiosError(err) {
  if (err instanceof ApiError) return err;

  // AxiosError
  if (axios.isAxiosError?.(err)) {
    // Request canceled via AbortController
    if (err.code === 'ERR_CANCELED') {
      return new ApiError('Request cancelled', { status: 0, code: 'CANCELED' });
    }

    const status = err.response?.status || 0;
    const data = err.response?.data;

    // Backend standardized shape: { error: { message, code } }
    const message =
      data?.error?.message ||
      data?.error ||
      data?.message ||
      err.message ||
      'Request failed';

    const code = data?.error?.code;

    return new ApiError(String(message), { status, code, details: data });
  }

  // Something else thrown
  if (err instanceof Error) {
    return new ApiError(err.message || 'Request failed', { status: 0 });
  }

  return new ApiError('Request failed', { status: 0, details: err });
}