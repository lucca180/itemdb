export type WatchdogState = {
  consecutiveFailures: number;
  lastReloadAt: string | null;
};

export const emptyState = (): WatchdogState => ({
  consecutiveFailures: 0,
  lastReloadAt: null,
});

export function inCooldown(lastReloadAt: string | null, cooldownSec: number, now = Date.now()) {
  if (!lastReloadAt) return false;
  return (now - Date.parse(lastReloadAt)) / 1000 < cooldownSec;
}

/** Returns updated failure count and whether pm2 stop/start should run. */
export function afterUnhealthyCycle(failures: number, threshold: number) {
  const next = failures + 1;
  if (next < threshold) return { failures: next, reload: false as const };
  return { failures: 0, reload: true as const, lastReloadAt: new Date().toISOString() };
}
