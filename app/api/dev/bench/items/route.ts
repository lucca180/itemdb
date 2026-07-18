import { getManyItems } from '@pages/api/v1/items/many';
import { writeItemCache } from '@app/server/items/itemV2Cache';
import { ItemService } from '@services/ItemService';
import { parseItemIntent } from '@types';
import { redisCache as redis } from '@utils/api/redis';
import prisma from '@utils/prisma';
import type { NextRequest } from 'next/server';

const DEFAULT_COUNT = 50;
const DEFAULT_RUNS = 3;
const MAX_COUNT = 20000;
const MAX_RUNS = 10;

type BenchSample = {
  ms: number;
  bytes: number;
  itemCount: number;
  /** Present for cache paths — 0 means full Redis hit. */
  dbCount?: number;
};

/**
 * Dev-only micro-benchmark for ItemV2 loaders + Redis cache-aside.
 *
 * GET /api/dev/bench/items?count=50&runs=3&intent=card
 * Optional: &ids=1,2,3 (skip random sampling)
 *
 * Compares: v1 getManyItems | v2 Prisma | v2 cache miss (?fresh) | v2 cache hit.
 * Returns 404 outside development.
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const params = new URL(request.url).searchParams;
  const count = clampInt(params.get('count'), DEFAULT_COUNT, 1, MAX_COUNT);
  const runs = clampInt(params.get('runs'), DEFAULT_RUNS, 1, MAX_RUNS);
  const intent = parseItemIntent(params.get('intent'), 'card');
  if (!intent) {
    return Response.json({ error: 'Invalid intent' }, { status: 400 });
  }

  const ids = params.get('ids') ? parseIds(params.get('ids')!) : await sampleRandomIds(count);

  if (ids.length === 0) {
    return Response.json({ error: 'No item ids to bench' }, { status: 400 });
  }

  const query = { type: 'id' as const, data: ids.map(String) };
  const idQueryV1 = { id: ids.map(String) };

  // Warm Redis so the hit path is real (await write — don't rely on after()).
  const warmItems = await ItemService.getManyItems(query, { intent, limit: ids.length });
  if (redis) {
    await writeItemCache(
      'id',
      intent,
      Object.entries(warmItems).map(([key, item]) => ({
        key,
        json: JSON.stringify(item),
        internalId: item.internal_id,
      }))
    );
  }

  const v1: BenchSample[] = [];
  const v2Prisma: BenchSample[] = [];
  const v2Miss: BenchSample[] = [];
  const v2Hit: BenchSample[] = [];

  for (let i = 0; i < runs; i++) {
    v1.push(await measure(() => getManyItems(idQueryV1, ids.length)));
    v2Prisma.push(
      await measure(() => ItemService.getManyItems(query, { intent, limit: ids.length }))
    );
    v2Miss.push(
      await measure(() =>
        ItemService.getCachedManyItems(query, { intent, limit: ids.length, fresh: true })
      )
    );
    v2Hit.push(
      await measure(() =>
        ItemService.getCachedManyItems(query, { intent, limit: ids.length, fresh: false })
      )
    );
  }

  return Response.json(
    {
      env: process.env.NODE_ENV,
      redis: Boolean(redis),
      intent,
      count: ids.length,
      runs,
      ids: ids.slice(0, 20),
      idsTruncated: ids.length > 20,
      results: {
        v1: summarize(v1),
        v2_prisma: summarize(v2Prisma),
        v2_cache_miss: summarize(v2Miss),
        v2_cache_hit: summarize(v2Hit),
      },
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

function clampInt(raw: string | null, fallback: number, min: number, max: number): number {
  if (raw == null || raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

function parseIds(raw: string): number[] {
  return [
    ...new Set(
      raw
        .split(',')
        .map((part) => Number(part.trim()))
        .filter((n) => Number.isFinite(n) && n > 0)
        .map((n) => Math.trunc(n))
    ),
  ].slice(0, MAX_COUNT);
}

async function sampleRandomIds(count: number): Promise<number[]> {
  const rows = await prisma.$queryRaw<{ internal_id: number }[]>`
    SELECT internal_id
    FROM Items
    WHERE canonical_id IS NULL
    ORDER BY RAND()
    LIMIT ${count}
  `;
  return rows.map((row) => row.internal_id);
}

async function measure(fn: () => Promise<unknown>): Promise<BenchSample> {
  const started = performance.now();
  const result = await fn();
  const ms = performance.now() - started;

  if (isCachedManyResult(result)) {
    const items = JSON.parse(result.body) as Record<string, unknown>;
    return {
      ms: round(ms),
      bytes: result.body.length,
      itemCount: Object.keys(items).length,
      dbCount: result.dbCount,
    };
  }

  const body = JSON.stringify(result);
  const items = result as Record<string, unknown>;
  return {
    ms: round(ms),
    bytes: body.length,
    itemCount: Object.keys(items).length,
  };
}

function isCachedManyResult(value: unknown): value is { body: string; dbCount: number } {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as { body?: unknown }).body === 'string' &&
    typeof (value as { dbCount?: unknown }).dbCount === 'number'
  );
}

function summarize(samples: BenchSample[]) {
  const ms = samples.map((s) => s.ms);
  const bytes = samples.map((s) => s.bytes);
  return {
    avgMs: round(mean(ms)),
    minMs: Math.min(...ms),
    maxMs: Math.max(...ms),
    avgBytes: Math.round(mean(bytes)),
    avgBytesPerItem: Math.round(mean(bytes) / Math.max(1, mean(samples.map((s) => s.itemCount)))),
    itemCount: samples[0]?.itemCount ?? 0,
    samples,
  };
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}
