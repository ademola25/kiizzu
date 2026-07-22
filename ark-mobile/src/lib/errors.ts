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
  if (err instanceof Error && err.message) return err.message;

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

  return fallback;
}
