/* eslint-disable no-console */
import 'dotenv/config';
import { PrismaClient, Prisma } from '../prisma/generated/client.js';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const LOCK_FILE = resolve(dirname(fileURLToPath(import.meta.url)), '../.cleanup-restock.lock');

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

type CliOptions = {
  batch: number;
  days: number;
  dryRun: boolean;
};

const DEFAULT_BATCH = 10_000;
const DEFAULT_DAYS = 365;
const MIN_DAYS = 180;

function log(message: string) {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log(`[${timestamp}] ${message}`);
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    batch: DEFAULT_BATCH,
    days: DEFAULT_DAYS,
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (arg === '--days') {
      const value = argv[index + 1];

      if (!value) {
        fail('Missing value for --days');
      }

      options.days = Number.parseInt(value, 10);
      index += 1;
      continue;
    }

    if (arg === '--batch') {
      const value = argv[index + 1];

      if (!value) {
        fail('Missing value for --batch');
      }

      options.batch = Number.parseInt(value, 10);
      index += 1;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      console.log(
        'Usage: yarn tsx scripts/cleanup-restock-history.ts [--dry-run] [--days 365] [--batch 10000]'
      );
      process.exit(0);
    }

    fail(`Unknown option: ${arg}`);
  }

  if (!Number.isInteger(options.days) || options.days < MIN_DAYS) {
    fail(`--days must be an integer >= ${MIN_DAYS}`);
  }

  if (!Number.isInteger(options.batch) || options.batch <= 0) {
    fail('--batch must be a positive integer');
  }

  return options;
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    fail('DATABASE_URL is not set. Check your .env file.');
  }

  const adapter = new PrismaMariaDb(databaseUrl);

  return new PrismaClient({ adapter });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  acquireLock();

  const prisma = createPrismaClient();

  const cutoffDate = new Date(Date.now() - options.days * 24 * 60 * 60 * 1000);

  try {
    log(`cutoff=${cutoffDate.toISOString()} | batch=${options.batch}`);

    if (options.dryRun) {
      const remaining = await prisma.restockAuctionHistory.count({
        where: { addedAt: { lt: cutoffDate } },
      });
      log(`Dry-run mode - rows that would be deleted: ${remaining}`);
      return;
    }

    // Prisma deleteMany does not support LIMIT, so raw SQL is required here.
    const deleted = await prisma.$executeRaw(
      Prisma.sql`DELETE FROM RestockAuctionHistory WHERE addedAt < ${cutoffDate} LIMIT ${Prisma.raw(String(options.batch))}`
    );

    log(`deleted=${deleted}`);
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
