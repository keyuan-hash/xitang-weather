export function readStorage<T>(
  key: string,
  fallback: T,
  validate?: (value: unknown) => value is T,
): T {
  try {
    const raw = localStorage.getItem(`xitang:${key}`);
    if (!raw) return fallback;
    const value: unknown = JSON.parse(raw);
    return !validate || validate(value) ? (value as T) : fallback;
  } catch {
    return fallback;
  }
}
export function writeStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(`xitang:${key}`, JSON.stringify(value));
  } catch {
    /* Private browsing / full storage: keep in-memory state working. */
  }
}
