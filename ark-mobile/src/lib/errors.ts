// Shared helpers for turning thrown errors into user-facing strings.

type AxiosLikeError = {
  response?: {
    data?:
      | { detail?: string }
      | Record<string, string | string[] | unknown>;
  };
  message?: string;
};

/**
 * Extracts a single human-readable message from anything thrown by an axios
 * call or a plain `Error`. DRF returns field-error dicts of shape
 * `{ field: ["msg", "msg"] }`; this collapses them into the first message we
 * find. Falls back to `fallback` when nothing useful is present.
 */
export function errorMessage(err: unknown, fallback: string): string {
  // Read the server's message FIRST. Axios errors are Error instances, so
  // checking `err instanceof Error` up front short-circuited every API failure
  // in the app to the useless "Request failed with status code 400" and never
  // reached the response body below. Users saw a status code where the backend
  // had sent a plain-English reason — and so did we while debugging.
  const data = (err as AxiosLikeError)?.response?.data;
  if (data && typeof data === 'object') {
    const detail = (data as { detail?: unknown }).detail;
    if (typeof detail === 'string' && detail) return detail;

    // DRF field errors: { field: ["msg"] | "msg" }.
    for (const value of Object.values(data)) {
      if (typeof value === 'string' && value) return value;
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
        return value[0];
      }
    }
  }

  // Only now consider the thrown Error's own message, and only when it is not
  // an axios status string — "Request failed with status code 400" tells a user
  // nothing the fallback does not say better.
  if (err instanceof Error && err.message && !/^Request failed with status code/.test(err.message)) {
    return err.message;
  }

  return fallback;
}
