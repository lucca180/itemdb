export function getOrCreatePrefetch<K, T>(
  cache: Map<K, Promise<T>>,
  key: K,
  load: () => Promise<T>
): Promise<T> {
  const cached = cache.get(key);
  if (cached) return cached;

  const pending = load().catch((error) => {
    cache.delete(key);
    throw error;
  });
  cache.set(key, pending);
  return pending;
}
