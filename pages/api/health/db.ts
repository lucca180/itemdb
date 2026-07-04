import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@utils/prisma';

const DB_PROBE_TIMEOUT_MS = 3_000;

export default async function handle(_req: NextApiRequest, res: NextApiResponse) {
  const started = Date.now();

  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('db_probe_timeout')), DB_PROBE_TIMEOUT_MS);
      }),
    ]);

    return res.status(200).json({
      ok: true,
      db: { ok: true, latencyMs: Date.now() - started },
      buildId: process.env.BUILD_ID ?? null,
    });
  } catch (error) {
    const message =
      process.env.NODE_ENV === 'production'
        ? 'unavailable'
        : error instanceof Error
          ? error.message
          : 'unknown';

    return res.status(503).json({
      ok: false,
      db: { ok: false, error: message },
      buildId: process.env.BUILD_ID ?? null,
    });
  }
}
