/* eslint-disable no-console */
import 'dotenv/config';
import { PrismaClient, Prisma } from '../prisma/generated/client.js';
import { createPrismaAdapter } from '../utils/mariadbAdapter.js';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const LOCK_FILE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../.cleanup-price-process.lock'
);

function acquireLock(): void {
  if (existsSync(LOCK_FILE)) {
    const existingPid = Number(readFileSync(LOCK_FILE, 'utf8').trim());

    const isRunning =
      !Number.isNaN(existingPid) &&
      (() => {
        try {
          process.kill(existingPid, 0);
          return true;
        } catch {
          return false;
        }
      })();

    if (isRunning) {
      fail(`Already running (PID ${existingPid}). Exiting.`);
    }

    // Stale lock from a previous crash — remove it
    unlinkSync(LOCK_FILE);
  }

  writeFileSync(LOCK_FILE, String(process.pid), 'utf8');
}

function releaseLock(): void {
  try {
    unlinkSync(LOCK_FILE);
  } catch {
    // ignore if already removed
  }
}

// MAX_PAST_DAYS mirrors the queue lookback in pages/api/v1/prices/process.ts. Keep both in sync.
const MAX_PAST_DAYS = 60;
const EXPIRED_DAYS = MAX_PAST_DAYS + 7;
const PROCESSED_DAYS = 45;
const SUPERSEDED_DAYS = 30;

const STEP_NAMES = ['expired', 'processed', 'superseded'] as const;
type StepName = (typeof STEP_NAMES)[number];

type CliOptions = {
  batch: number;
  maxSeconds: number;
  /** DELETE statements per run across all steps; null = only the time budget limits the run. */
  maxBatches: number | null;
  pauseMs: number;
  steps: StepName[];
  dryRun: boolean;
};

const DEFAULT_BATCH = 5_000;
// Stays under a one-minute cron interval; the lock covers any overlap anyway.
const DEFAULT_MAX_SECONDS = 50;
// Breathing room between batches so the DELETEs don't monopolize disk IO.
const DEFAULT_PAUSE_MS = 1_000;

function log(message: string) {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log(`[${timestamp}] ${message}`);
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function parseIntArg(argv: string[], index: number, name: string): number {
  const value = argv[index + 1];

  if (!value) {
    fail(`Missing value for ${name}`);
  }

  return Number.parseInt(value, 10);
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    batch: DEFAULT_BATCH,
    maxSeconds: DEFAULT_MAX_SECONDS,
    maxBatches: null,
    pauseMs: DEFAULT_PAUSE_MS,
    steps: [...STEP_NAMES],
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (arg === '--batch') {
      options.batch = parseIntArg(argv, index, arg);
      index += 1;
      continue;
    }

    if (arg === '--max-seconds') {
      options.maxSeconds = parseIntArg(argv, index, arg);
      index += 1;
      continue;
    }

    if (arg === '--max-batches') {
      options.maxBatches = parseIntArg(argv, index, arg);
      index += 1;
      continue;
    }

    if (arg === '--pause-ms') {
      options.pauseMs = parseIntArg(argv, index, arg);
      index += 1;
      continue;
    }

    if (arg === '--steps') {
      const value = argv[index + 1];

      if (!value) {
        fail('Missing value for --steps');
      }

      const steps = value.split(',').map((step) => step.trim());
      const invalid = steps.filter((step) => !STEP_NAMES.includes(step as StepName));

      if (invalid.length > 0) {
        fail(`Unknown step(s): ${invalid.join(', ')}. Valid: ${STEP_NAMES.join(', ')}`);
      }

      // Keep the canonical order: expired → processed → superseded.
      options.steps = STEP_NAMES.filter((step) => steps.includes(step));
      index += 1;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      console.log(
        'Usage: yarn tsx scripts/cleanup-price-process.ts [--dry-run] [--steps expired,processed,superseded] [--batch 5000] [--max-seconds 50] [--max-batches N] [--pause-ms 1000]'
      );
      process.exit(0);
    }

    fail(`Unknown option: ${arg}`);
  }

  if (!Number.isInteger(options.batch) || options.batch <= 0) {
    fail('--batch must be a positive integer');
  }

  if (!Number.isInteger(options.maxSeconds) || options.maxSeconds <= 0) {
    fail('--max-seconds must be a positive integer');
  }

  if (
    options.maxBatches !== null &&
    (!Number.isInteger(options.maxBatches) || options.maxBatches <= 0)
  ) {
    fail('--max-batches must be a positive integer');
  }

  if (!Number.isInteger(options.pauseMs) || options.pauseMs < 0) {
    fail('--pause-ms must be a non-negative integer');
  }

  if (options.steps.length === 0) {
    fail('--steps must list at least one step');
  }

  return options;
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    fail('DATABASE_URL is not set. Check your .env file.');
  }

  const adapter = createPrismaAdapter(databaseUrl, { statementTimeout: false });

  return new PrismaClient({ adapter });
}

/** WHERE predicate of each step, shared by the DELETE and the dry-run SELECT. */
function getStepPredicates(now: number): Record<StepName, Prisma.Sql> {
  const dayMs = 24 * 60 * 60 * 1000;
  const expiredCutoff = new Date(now - EXPIRED_DAYS * dayMs);
  const processedCutoff = new Date(now - PROCESSED_DAYS * dayMs);
  const supersededCutoff = new Date(now - SUPERSEDED_DAYS * dayMs);

  return {
    // anything older than the max lookback is useless, processed or not
    expired: Prisma.sql`addedAt < ${expiredCutoff}`,
    processed: Prisma.sql`processed = true AND addedAt < ${processedCutoff}`,
    // rows older than a newer price of the same item
    superseded: Prisma.sql`
      addedAt < ${supersededCutoff}
      AND EXISTS (
        SELECT 1 FROM ItemPrices i
        WHERE i.item_iid = PriceProcess2.item_iid AND i.addedAt > PriceProcess2.addedAt
      )
    `,
  };
}

const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));

async function main() {
  const options = parseArgs(process.argv.slice(2));

  acquireLock();

  const prisma = createPrismaClient();
  const predicates = getStepPredicates(Date.now());
  const limit = Prisma.raw(String(options.batch));

  try {
    log(
      `steps=${options.steps.join(',')} | batch=${options.batch} | maxSeconds=${options.maxSeconds} | maxBatches=${options.maxBatches ?? 'none'} | pauseMs=${options.pauseMs}`
    );

    if (options.dryRun) {
      // Full COUNTs take minutes on this table; report what the next batch of each step would hit.
      for (const step of options.steps) {
        const [row] = await prisma.$queryRaw<{ c: bigint }[]>(
          Prisma.sql`SELECT COUNT(*) AS c FROM (SELECT 1 FROM PriceProcess2 WHERE ${predicates[step]} LIMIT ${limit}) t`
        );
        log(`Dry-run - ${step}: next batch would delete ${Number(row?.c ?? 0)} rows`);
      }
      return;
    }

    const deadline = Date.now() + options.maxSeconds * 1000;
    const deleted: Record<StepName, number> = { expired: 0, processed: 0, superseded: 0 };
    let batches = 0;
    // Set only when a limit stops a batch that still had to run.
    let stopReason: string | null = null;

    for (const step of options.steps) {
      let count: number;

      do {
        if (Date.now() >= deadline) {
          stopReason = 'time budget reached';
          break;
        }

        if (options.maxBatches !== null && batches >= options.maxBatches) {
          stopReason = 'max batches reached';
          break;
        }

        if (batches > 0 && options.pauseMs > 0) await sleep(options.pauseMs);

        const startedAt = Date.now();
        // Prisma deleteMany does not support LIMIT, so raw SQL is required here.
        count = await prisma.$executeRaw(
          Prisma.sql`DELETE FROM PriceProcess2 WHERE ${predicates[step]} LIMIT ${limit}`
        );
        deleted[step] += count;
        batches += 1;

        log(`${step}: deleted=${count} in ${Date.now() - startedAt}ms`);
      } while (count >= options.batch);

      if (stopReason) break;
    }

    log(
      `total expired=${deleted.expired} processed=${deleted.processed} superseded=${deleted.superseded} | batches=${batches} | ${stopReason ? `${stopReason}, more left` : 'done'}`
    );
  } finally {
    await prisma.$disconnect();
    releaseLock();
  }
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    fail(error.stack || error.message);
  }

  fail(String(error));
});
