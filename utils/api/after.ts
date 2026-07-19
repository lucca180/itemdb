/**
 * Runtime-safe wrapper around Next.js `after()`.
 *
 * `after` is only importable from the App Router graph: a static
 * `import { after } from 'next/server'` in a module that is also reachable
 * from the Pages Router breaks the Turbopack build ("This API is only
 * available in Server Components in the App Router").
 *
 * Several cache helpers (`itemV2Cache`, `listItemsV2Cache`) live behind the
 * shared `ItemService` / `ListService` facades, which are imported by both
 * routers. Importing `after` lazily keeps those modules usable everywhere:
 * inside an App Router request the callback is scheduled with `after`;
 * anywhere else it falls back to a detached best-effort run.
 *
 * The dynamic import is cached by the module system, so the extra `await`
 * only costs a microtask and preserves the request's async context (needed
 * for `after` to attach to the current response).
 */
export async function runAfter(callback: () => Promise<void> | void): Promise<void> {
  try {
    const { after } = await import('next/server');
    after(callback);
  } catch {
    // Not inside an App Router request (e.g. Pages Router / no request scope):
    // run detached so it never blocks or throws back into the caller.
    void (async () => {
      try {
        await callback();
      } catch (error) {
        console.error('runAfter fallback error', error);
      }
    })();
  }
}
