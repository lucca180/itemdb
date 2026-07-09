/* eslint-disable no-console */
import 'dotenv/config';
import { execFile } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { resolveActiveBackend } from '../utils/watchdog/resolveActiveBackend.js';
import {
  afterUnhealthyCycle,
  emptyState,
  inCooldown,
  type WatchdogState,
} from '../utils/watchdog/state.js';
import { notifyWatchdogRestart } from '../utils/watchdog/notifyRestart.js';

const exec = promisify(execFile);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lockFile = resolve(root, '.pool-watchdog.lock');
const stateFile = resolve(root, '.pool-watchdog-state.json');

const PROBES = 6;
const PROBE_FAIL_MAX = 3;
const FAILURES_BEFORE_RELOAD = 4;
const COOLDOWN_SEC = 480; // 8 minutes
const TIMEOUT_MS = 12_000;
const STOP_WAIT_MS = 15_000;

const dryRun = process.argv.includes('--dry-run');

function log(msg: string) {
  console.log(`[${new Date().toISOString().slice(0, 19)}] ${msg}`);
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function withLock<T>(fn: () => Promise<T>) {
  if (existsSync(lockFile)) {
    const pid = Number(readFileSync(lockFile, 'utf8'));
    try {
      process.kill(pid, 0);
      console.error(`Already running (PID ${pid})`);
      process.exit(1);
    } catch {
      unlinkSync(lockFile);
    }
  }
  writeFileSync(lockFile, String(process.pid));
  return fn().finally(() => {
    try {
      unlinkSync(lockFile);
    } catch {
      /* empty */
    }
  });
}

function readState(): WatchdogState {
  if (!existsSync(stateFile)) return emptyState();
  try {
    return JSON.parse(readFileSync(stateFile, 'utf8')) as WatchdogState;
  } catch {
    return emptyState();
  }
}

function writeState(state: WatchdogState) {
  writeFileSync(stateFile, JSON.stringify(state));
}

async function probe(port: number) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return (await fetch(`http://127.0.0.1:${port}/api/health/db`, { signal: ctrl.signal })).ok;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

async function main() {
  const backend = resolveActiveBackend();
  log(`Active: ${backend.app}:${backend.port}`);

  const state = readState();
  if (inCooldown(state.lastReloadAt, COOLDOWN_SEC)) {
    log('Cooldown — skip');
    return;
  }

  let failed = 0;
  for (let i = 0; i < PROBES; i += 1) {
    if (!(await probe(backend.port))) failed += 1;
  }

  if (failed < PROBE_FAIL_MAX) {
    writeState(emptyState());
    log(`OK (${PROBES - failed}/${PROBES} probes)`);
    return;
  }

  const result = afterUnhealthyCycle(state.consecutiveFailures, FAILURES_BEFORE_RELOAD);
  if (!result.reload) {
    writeState({ ...state, consecutiveFailures: result.failures });
    log(`Unhealthy — ${result.failures}/${FAILURES_BEFORE_RELOAD} cycles`);
    return;
  }

  const startCmd = ['start', 'ecosystem.config.js', '--only', backend.app, '--update-env'];
  if (dryRun) {
    log(`[dry-run] pm2 stop ${backend.app} (cwd=${backend.cwd})`);
    log(`[dry-run] wait ${STOP_WAIT_MS / 1000}s`);
    log(`[dry-run] pm2 ${startCmd.join(' ')} (cwd=${backend.cwd})`);
  } else {
    log(`pm2 stop ${backend.app}`);
    await exec('pm2', ['stop', backend.app], { cwd: backend.cwd, timeout: 60_000 });
    log(`waiting ${STOP_WAIT_MS / 1000}s`);
    await sleep(STOP_WAIT_MS);
    log(`pm2 start ${backend.app}`);
    await exec('pm2', startCmd, { cwd: backend.cwd, timeout: 120_000 });
  }

  writeState({
    consecutiveFailures: 0,
    lastReloadAt: result.lastReloadAt ?? new Date().toISOString(),
  });
  log('Restart done');

  if (!dryRun) {
    await notifyWatchdogRestart({
      app: backend.app,
      port: backend.port,
      cwd: backend.cwd,
      failedProbes: failed,
      totalProbes: PROBES,
      unhealthyCycles: FAILURES_BEFORE_RELOAD,
    });
  }
}

withLock(main).catch((e) => {
  console.error(e);
  process.exit(1);
});
