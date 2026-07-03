import { describe, expect, test, vi, afterEach } from 'vitest';
import type { NextApiRequest } from 'next';
import objectHash from 'object-hash';

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  checkHash: vi.fn(),
  metricCount: vi.fn(),
}));

vi.mock('@utils/prisma', () => ({
  default: {
    hashValidationKey: {
      findFirst: mocks.findFirst,
    },
  },
}));

vi.mock('@utils/hash', () => ({
  checkHash: mocks.checkHash,
}));

vi.mock('@sentry/nextjs', () => ({
  metrics: {
    count: mocks.metricCount,
  },
}));

import {
  createExtractorHash,
  clearKeyCache,
  validateExtractorHash,
} from '@utils/api/hashValidator';

const req = (version?: string): NextApiRequest =>
  ({
    headers: version ? { 'itemdb-version': version } : {},
  }) as NextApiRequest;

describe('hash validator', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetAllMocks();
    clearKeyCache();
    vi.useRealTimers();
  });

  test('creates the new hash from the whole payload and hash key', () => {
    const payload = {
      items: [{ name: 'A', ownerHash: 'kept' }],
      hash: 'kept',
    };

    expect(createExtractorHash(payload, 'secret')).toBe(
      objectHash.sha1({ payload: JSON.stringify(payload), hashKey: 'secret' })
    );
  });

  test('accepts new hash with active version secret', async () => {
    const payload = {
      items: [{ name: 'Test Item', img: 'https://images.neopets.com/items/a.gif' }],
    };
    const hash = createExtractorHash(payload, 'secret');
    mocks.findFirst.mockResolvedValue({ secret: 'secret', active: true, revokedAt: null });

    const result = await validateExtractorHash({
      req: req('1104'),
      endpoint: 'items',
      hash,
      payload,
    });

    expect(result).toEqual({ valid: true, mode: 'new', versionCode: 1104 });
    expect(mocks.metricCount).toHaveBeenCalledWith('extractor.hash_validation', 1, {
      attributes: { mode: 'new', endpoint: 'items', versionCode: '1104' },
    });
  });

  test('rejects changed payload for new hash', async () => {
    vi.stubEnv('ITEMDB_ACCEPT_LEGACY_EXTRACTOR_HASH', 'false');

    const hash = createExtractorHash({ items: [{ name: 'Original' }] }, 'secret');
    mocks.findFirst.mockResolvedValue({ secret: 'secret', active: true, revokedAt: null });

    const result = await validateExtractorHash({
      req: req('1104'),
      endpoint: 'items',
      hash,
      payload: { items: [{ name: 'Changed' }] },
    });

    expect(result).toEqual({ valid: false, mode: 'invalid', versionCode: 1104 });
    expect(mocks.metricCount).toHaveBeenCalledWith('extractor.hash_validation', 1, {
      attributes: { mode: 'invalid', endpoint: 'items', versionCode: '1104' },
    });
  });

  test('accepts legacy hash while compatibility flag allows it', async () => {
    vi.stubEnv('ITEMDB_ACCEPT_LEGACY_EXTRACTOR_HASH', 'true');
    mocks.findFirst.mockResolvedValue(null);
    mocks.checkHash.mockReturnValue(true);

    const result = await validateExtractorHash({
      req: req('1104'),
      endpoint: 'trades',
      hash: 'legacy-hash',
      payload: { tradeLots: [] },
    });

    expect(result).toEqual({ valid: true, mode: 'legacy', versionCode: 1104 });
    expect(mocks.metricCount).toHaveBeenCalledWith('extractor.hash_validation', 1, {
      attributes: { mode: 'legacy', endpoint: 'trades', versionCode: '1104' },
    });
  });

  test('rejects legacy hash when compatibility flag is disabled', async () => {
    vi.stubEnv('ITEMDB_ACCEPT_LEGACY_EXTRACTOR_HASH', 'false');
    mocks.findFirst.mockResolvedValue(null);
    mocks.checkHash.mockReturnValue(true);

    const result = await validateExtractorHash({
      req: req('1104'),
      endpoint: 'prices',
      hash: 'legacy-hash',
      payload: { itemPrices: [] },
    });

    expect(result).toEqual({ valid: false, mode: 'invalid', versionCode: 1104 });
    expect(mocks.checkHash).not.toHaveBeenCalled();
    expect(mocks.metricCount).toHaveBeenCalledWith('extractor.hash_validation', 1, {
      attributes: { mode: 'invalid', endpoint: 'prices', versionCode: '1104' },
    });
  });

  test('bypasses validation with tarnum key when version has no revoked key', async () => {
    vi.stubEnv('TARNUM_KEY', 'tarnum');
    mocks.findFirst.mockResolvedValue(null);

    const result = await validateExtractorHash({
      req: req('1104'),
      endpoint: 'items/open',
      hash: 'anything',
      payload: { items: [] },
      bypassKey: 'tarnum',
    });

    expect(result).toEqual({ valid: true, mode: 'bypass', versionCode: 1104 });
    expect(mocks.findFirst).toHaveBeenCalled();
    expect(mocks.checkHash).not.toHaveBeenCalled();
    expect(mocks.metricCount).toHaveBeenCalledWith('extractor.hash_validation', 1, {
      attributes: { mode: 'bypass', endpoint: 'items/open', versionCode: '1104' },
    });
  });

  test('rejects revoked version before tarnum bypass', async () => {
    vi.stubEnv('TARNUM_KEY', 'tarnum');
    vi.stubEnv('ITEMDB_ACCEPT_LEGACY_EXTRACTOR_HASH', 'true');
    mocks.findFirst.mockResolvedValue({
      secret: 'secret',
      active: false,
      revokedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    mocks.checkHash.mockReturnValue(true);

    const result = await validateExtractorHash({
      req: req('1104'),
      endpoint: 'items/open',
      hash: 'legacy-hash',
      payload: { items: [] },
      bypassKey: 'tarnum',
    });

    expect(result).toEqual({ valid: false, mode: 'invalid', versionCode: 1104 });
    expect(mocks.checkHash).not.toHaveBeenCalled();
    expect(mocks.metricCount).toHaveBeenCalledWith('extractor.hash_validation', 1, {
      attributes: { mode: 'revoked', endpoint: 'items/open', versionCode: '1104' },
    });
  });

  test('rejects revoked version before legacy hash and legacy skip endpoints', async () => {
    vi.stubEnv('ITEMDB_ACCEPT_LEGACY_EXTRACTOR_HASH', 'true');
    mocks.findFirst.mockResolvedValue({
      secret: 'secret',
      active: true,
      revokedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    mocks.checkHash.mockReturnValue(true);

    const result = await validateExtractorHash({
      req: req('1104'),
      endpoint: 'items',
      hash: 'legacy-hash',
      payload: { items: [] },
    });

    expect(result).toEqual({ valid: false, mode: 'invalid', versionCode: 1104 });
    expect(mocks.checkHash).not.toHaveBeenCalled();
    expect(mocks.metricCount).toHaveBeenCalledWith('extractor.hash_validation', 1, {
      attributes: { mode: 'revoked', endpoint: 'items', versionCode: '1104' },
    });
  });

  test('refetches hash validation key after cache ttl expires', async () => {
    vi.stubEnv('HASH_VALIDATION_KEY_CACHE_TTL_MS', '1000');
    mocks.findFirst.mockResolvedValue({ secret: 'secret', active: true, revokedAt: null });

    const payload = { items: [{ name: 'Test Item' }] };
    const hash = createExtractorHash(payload, 'secret');

    await validateExtractorHash({
      req: req('1104'),
      endpoint: 'items',
      hash,
      payload,
    });

    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 1001);

    mocks.findFirst.mockResolvedValue({
      secret: 'secret',
      active: true,
      revokedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const result = await validateExtractorHash({
      req: req('1104'),
      endpoint: 'items',
      hash,
      payload,
    });

    expect(result).toEqual({ valid: false, mode: 'invalid', versionCode: 1104 });
    expect(mocks.findFirst).toHaveBeenCalledTimes(2);
  });
});
