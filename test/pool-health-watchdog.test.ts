import { describe, expect, test } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parsePort, resolveActiveBackend } from '@utils/watchdog/resolveActiveBackend';
import { afterUnhealthyCycle, emptyState, inCooldown } from '@utils/watchdog/state';

describe('resolveActiveBackend', () => {
  test('parses nginx snippet port', () => {
    expect(parsePort('proxy_pass http://127.0.0.1:4000;')).toBe(4000);
    expect(parsePort('proxy_pass http://127.0.0.1:4001;')).toBe(4001);
    expect(() => parsePort('proxy_pass http://127.0.0.1:5000;')).toThrow();
  });

  test('maps port to PM2 app', () => {
    const dir = mkdtempSync(join(tmpdir(), 'watchdog-'));
    const conf = join(dir, 'active.conf');
    writeFileSync(conf, 'proxy_pass http://127.0.0.1:4001;\n');
    expect(resolveActiveBackend(conf)).toEqual({
      app: 'itemdb-green',
      port: 4001,
      cwd: '/home/itemdb-green',
    });
  });
});

describe('watchdog state', () => {
  test('inCooldown', () => {
    const now = Date.parse('2026-07-04T12:00:00Z');
    expect(inCooldown('2026-07-04T11:50:00Z', 900, now)).toBe(true);
    expect(inCooldown(null, 900, now)).toBe(false);
  });

  test('afterUnhealthyCycle', () => {
    expect(afterUnhealthyCycle(0, 3)).toEqual({ failures: 1, reload: false });
    expect(afterUnhealthyCycle(2, 3).reload).toBe(true);
    expect(afterUnhealthyCycle(2, 3).failures).toBe(0);
  });

  test('emptyState', () => {
    expect(emptyState()).toEqual({ consecutiveFailures: 0, lastReloadAt: null });
  });
});
