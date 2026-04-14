/* eslint-disable no-console */
import 'dotenv/config';
import { spawn } from 'node:child_process';
import { createReadStream, createWriteStream, unlinkSync, existsSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGzip } from 'node:zlib';
import { S3 } from '../utils/googleCloud.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';

const TEMP_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../.dump-temp');
const R2_BUCKET = 'itemdb';
const DUMP_PREFIX = 'dumps';

type CliOptions = {
  dryRun: boolean;
  tables: string[];
};

type DatabaseConfig = {
  user: string;
  password: string;
  host: string;
  port: number;
  database: string;
};

const DEFAULT_TABLES = ['Items', 'ItemColor'] as const;

function log(message: string): void {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log(`[${timestamp}] ${message}`);
}

function fail(message: string): never {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    dryRun: false,
    tables: [],
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (arg === '--tables' || arg === '-t') {
      // Skip the flag itself, following args are table names
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: yarn dump:tables [OPTIONS] [TABLES...]

Dumps specified tables to R2 as individual .sql.gz files.
Defaults to Items and ItemColor if no tables specified.

Options:
  --tables, -t TABLES...  List of tables to dump (space-separated)
  --dry-run               Validate configuration without creating or uploading files
  --help, -h              Show this help message

Examples:
  yarn dump:tables                          # Dump Items and ItemColor (default)
  yarn dump:tables Items                    # Dump only Items table
  yarn dump:tables Items ItemColor Users    # Dump multiple tables
  yarn dump:tables --tables Items ItemColor # Same as above with explicit flag
  yarn dump:tables --dry-run Items          # Validate without uploading

Requirements:
  - DATABASE_URL must be set in .env (mysql://user:password@host:port/database)
  - mariadb-dump or mysqldump available in PATH
  - R2 credentials configured (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)

Output:
  - r2:itemdb/dumps/{table}.sql.gz (one file per table)
`);
      process.exit(0);
    }

    if (arg.startsWith('--')) {
      fail(`Unknown option: ${arg}`);
    }

    // Positional argument - treat as table name
    options.tables.push(arg);
  }

  // Use default tables if none specified
  if (options.tables.length === 0) {
    options.tables = [...DEFAULT_TABLES];
  }

  return options;
}

function parseDatabaseUrl(url: string): DatabaseConfig {
  // Expected format: mysql://user:password@host:port/database
  const pattern = /^mysql:\/\/([^:]+):([^@]+)@([^:/]+)(?::(\d+))?\/([^?]+)/;
  const match = url.match(pattern);

  if (!match) {
    fail('Invalid DATABASE_URL format. Expected: mysql://user:password@host:port/database');
  }

  const [, user, password, host, port, database] = match;

  return {
    user,
    password,
    host,
    port: port ? Number.parseInt(port, 10) : 3306,
    database,
  };
}

async function findDumpCommand(): Promise<string> {
  const commands = ['mariadb-dump', 'mysqldump'];

  for (const cmd of commands) {
    try {
      const result = await new Promise<boolean>((resolve) => {
        const proc = spawn(cmd, ['--version'], { stdio: 'ignore' });
        proc.on('error', () => resolve(false));
        proc.on('close', (code) => resolve(code === 0));
      });

      if (result) {
        log(`Found dump command: ${cmd}`);
        return cmd;
      }
    } catch {
      // Continue to next command
    }
  }

  fail('Neither mariadb-dump nor mysqldump found in PATH');
}

async function dumpTableToFile(
  dumpCmd: string,
  config: DatabaseConfig,
  table: string,
  outputFile: string
): Promise<void> {
  const args = [
    '--single-transaction',
    '--quick',
    '--skip-lock-tables',
    '--skip-add-locks',
    '--no-tablespaces',
    '--complete-insert',
    '--hex-blob',
    '--routines=0',
    '--triggers=0',
    '--events=0',
    `--user=${config.user}`,
    `--password=${config.password}`,
    `--host=${config.host}`,
    `--port=${config.port}`,
    config.database,
    table,
  ];

  log(`Dumping table: ${table}...`);

  await new Promise<void>((resolve, reject) => {
    const dumpProcess = spawn(dumpCmd, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const gzip = createGzip({ level: 9 });
    const writeStream = createWriteStream(outputFile);

    // Pipe dump output through gzip to file
    dumpProcess.stdout.pipe(gzip).pipe(writeStream);

    let errorOutput = '';
    dumpProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    writeStream.on('error', reject);
    gzip.on('error', reject);

    dumpProcess.on('error', (error) => {
      reject(new Error(`Failed to spawn ${dumpCmd}: ${error.message}`));
    });

    dumpProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Dump failed with code ${code}: ${errorOutput}`));
      } else {
        resolve();
      }
    });
  });

  // Get file size
  const { size } = await import('node:fs/promises').then((fs) => fs.stat(outputFile));
  const sizeMB = (size / 1024 / 1024).toFixed(2);
  log(`✓ Dump created: ${outputFile} (${sizeMB} MB)`);
}

async function uploadToR2(localFile: string, key: string): Promise<void> {
  log(`Uploading to R2: ${key}...`);

  // Read file as buffer
  const fileBuffer = await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const stream = createReadStream(localFile);

    stream.on('data', (chunk: string | Buffer) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });

  // Upload using existing S3 client
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: fileBuffer,
    ContentType: 'application/gzip',
    ContentLength: fileBuffer.length,
  });

  await S3.send(command);
  log(`✓ Upload complete: r2:${R2_BUCKET}/${key}`);
}

async function ensureTempDir(): Promise<void> {
  if (!existsSync(TEMP_DIR)) {
    await mkdir(TEMP_DIR, { recursive: true });
  }
}

async function cleanupTempDir(): Promise<void> {
  try {
    if (existsSync(TEMP_DIR)) {
      await rm(TEMP_DIR, { recursive: true, force: true });
    }
  } catch (error) {
    console.warn(`Warning: Failed to clean up temp directory: ${error}`);
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  log('=================================================================');
  log('Table Dump to R2');
  log('=================================================================');

  // Validate environment
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    fail('DATABASE_URL not set in .env');
  }

  const r2AccessKey = process.env.R2_ACCESS_KEY_ID;
  const r2SecretKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!r2AccessKey || !r2SecretKey) {
    fail('R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY must be set in .env');
  }

  // Parse database config
  const dbConfig = parseDatabaseUrl(databaseUrl);
  log(`Database: ${dbConfig.database}`);
  log(`Host:     ${dbConfig.host}:${dbConfig.port}`);
  log(`User:     ${dbConfig.user}`);
  log(`Bucket:   r2:${R2_BUCKET}/${DUMP_PREFIX}/`);
  log(`Tables:   ${options.tables.join(', ')} (${options.tables.length} total)`);
  log('=================================================================');

  // Find dump command
  const dumpCmd = await findDumpCommand();

  if (options.dryRun) {
    log('DRY RUN MODE - no files will be created or uploaded');
    log('Configuration validated successfully');
    return;
  }

  // Ensure temp directory exists
  await ensureTempDir();

  try {
    // Process each table
    for (const table of options.tables) {
      const tableLower = table.toLowerCase();
      const localFile = resolve(TEMP_DIR, `${tableLower}.sql.gz`);
      const r2Key = `${DUMP_PREFIX}/${tableLower}.sql.gz`;

      log('');
      log('-------------------------------------------------------------------');

      // Dump table
      await dumpTableToFile(dumpCmd, dbConfig, table, localFile);

      // Upload to R2
      await uploadToR2(localFile, r2Key);

      // Clean up local file
      unlinkSync(localFile);
    }

    log('');
    log('=================================================================');
    log('✓ All dumps completed successfully');
    log('=================================================================');
    log('');
    log('To restore these dumps:');
    for (const table of options.tables) {
      const tableLower = table.toLowerCase();
      log(`  gunzip -c ${tableLower}.sql.gz | mariadb -u ${dbConfig.user} -p ${dbConfig.database}`);
    }
    log('');
  } finally {
    // Clean up temp directory
    await cleanupTempDir();
  }
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    fail(error.stack || error.message);
  }

  fail(String(error));
});
