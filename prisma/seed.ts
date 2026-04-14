/* eslint-disable no-console */
/**
 * Prisma seed — local development
 *
 * Usage:
 *   npx prisma db seed
 *
 * Environment variables:
 *   DATABASE_URL - MariaDB connection string (required)
 *
 * SQL dumps are read from the prisma/ folder in this order:
 *   items[_(timestamp)].sql
 *   itemcolor[_(timestamp)].sql
 *   itemprices[_(timestamp)].sql
 *
 * Only the most recent file is used when multiple matches exist for the same prefix.
 * Files can be plain .sql or gzip-compressed .sql.gz.
 * Timestamp is optional (e.g., items.sql or items_20240413.sql both work).
 */

import 'dotenv/config';
import { PrismaClient } from './generated/client.js';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { spawn } from 'node:child_process';
import { readdirSync, createReadStream } from 'node:fs';
import { createGunzip } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { URL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const adapter = new PrismaMariaDb(process.env.DATABASE_URL || '');
const prisma = new PrismaClient({ adapter } as any);

// ---------------------------------------------------------------------------
// Test users created on every seed run (upsert — safe to re-run)
// ---------------------------------------------------------------------------
const TEST_USERS = [
  {
    id: 'dev-admin-00000000-0000-0000-0000-000000000001',
    email: 'admin@itemdb.dev',
    username: 'DevAdmin',
    role: 'ADMIN' as const,
  },
  {
    id: 'dev-user-000000-0000-0000-0000-000000000002',
    email: 'user@itemdb.dev',
    username: 'DevUser',
    role: 'USER' as const,
  },
];

async function seedUsers() {
  console.log('Seeding test users…');

  for (const user of TEST_USERS) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { role: user.role },
      create: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        last_login: new Date(),
        createdAt: new Date(),
      },
    });
    console.log(`  ✔ ${user.role.toLowerCase()} — ${user.email}`);
  }
}

// ---------------------------------------------------------------------------
// Dump import — read from prisma/ folder
// ---------------------------------------------------------------------------

const DUMP_PREFIXES = ['items', 'itemcolor', 'itemprices'] as const;
const DUMP_PATTERN = /^(items|itemcolor|itemprices)(_[^/\\]+)?\.sql(\.gz)?$/i;

function parseDatabaseUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname || 'localhost',
    port: parsed.port || '3306',
    user: parsed.username,
    password: parsed.password,
    database: parsed.pathname.replace(/^\//, ''),
  };
}

/**
 * Find the most recent dump file for each prefix in the prisma/ folder.
 * Returns an ordered list matching DUMP_PREFIXES, skipping any not found.
 */
function findDumpFiles(): string[] {
  const files = readdirSync(__dirname).filter((f) => DUMP_PATTERN.test(f));
  const result: string[] = [];

  for (const prefix of DUMP_PREFIXES) {
    const matches = files
      .filter((f) => f.toLowerCase().startsWith(prefix + '_'))
      .sort() // lexicographic — timestamps sort correctly as-is
      .reverse();

    if (matches.length > 0) {
      result.push(join(__dirname, matches[0]));
    }
  }

  return result;
}

async function importDumpFile(filePath: string) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is not set');

  const { host, port, user, password, database } = parseDatabaseUrl(dbUrl);
  const isGzip = filePath.endsWith('.gz');

  const mariadbArgs = [
    'exec', '-i', 'itemdb-db', 'mariadb',
    `-u${user}`, `-p${password}`, `-h${host}`, `-P${port}`,
    '--init-command=SET FOREIGN_KEY_CHECKS=0',
    database,
  ];

  const mariadb = spawn('docker', mariadbArgs, { stdio: ['pipe', 'inherit', 'inherit'] });

  const fileStream = createReadStream(filePath);
  const sourceStream: NodeJS.ReadableStream = isGzip
    ? fileStream.pipe(createGunzip())
    : fileStream;

  sourceStream.pipe(mariadb.stdin);

  await new Promise<void>((resolve, reject) => {
    mariadb.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`mariadb exited with code ${code} while importing ${filePath}`));
    });
    mariadb.on('error', reject);
  });
}

async function importDumps() {
  const dumpFiles = findDumpFiles();

  if (dumpFiles.length === 0) {
    console.log('\nNo dump files found in prisma/ — skipping import.');
    console.log(
      '  Expected filenames: items[_<timestamp>].sql, itemcolor[_<timestamp>].sql, itemprices[_<timestamp>].sql'
    );
    return;
  }

  console.log(`\nImporting ${dumpFiles.length} dump file(s) into itemdb-db…`);

  for (const filePath of dumpFiles) {
    const fileName = filePath.split(/[\\/]/).pop();
    console.log(`  → ${fileName}`);
    await importDumpFile(filePath);
    console.log(`    ✔ done`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  try {
    await seedUsers();
    await importDumps();
    console.log('\nSeed complete.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
