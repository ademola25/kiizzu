// Shared helper for endpoints that *might* be wrapped by DRF pagination later.
// The current backend list views return bare arrays, but settings could flip
// to `{count, next, previous, results}` — unwrap both shapes transparently.

export type Paginated<T> = { results: T[] };

export function unwrapList<T>(data: T[] | Paginated<T> | undefined): T[] {
  if (Array.isArray(data)) return data;
  if (data && 'results' in data && Array.isArray(data.results)) {
    return data.results;
  }
  return [];
}
