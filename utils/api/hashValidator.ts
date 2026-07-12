import type { NextApiRequest } from 'next';
import { timingSafeEqual } from 'crypto';
import objectHash from 'object-hash';
import * as Sentry from '@sentry/nextjs';
import prisma from '@utils/prisma';
import { checkHash } from '@utils/hash';

export type HashValidationMode = 'new' | 'legacy' | 'invalid' | 'bypass' | 'dev-skip' | 'revoked';

type ValidationArgs = {
  req: NextApiRequest;
  endpoint: string;
  hash: unknown;
  payload: unknown;
  bypassKey?: string;
  validatorName?: string;
};

type ValidationResult =
  | { valid: true; mode: Exclude<HashValidationMode, 'invalid'>; versionCode: number | null }
  | { valid: false; mode: 'invalid'; versionCode: number | null };

const DEFAULT_VALIDATOR = 'itemDataExtractor';
const SKIP_IN_DEV = false;
const KEY_CACHE_TTL = 60_000;

const keyCache = new Map<string, { secret: string | null; revoked: boolean; expiresAt: number }>();

export function clearKeyCache() {
  keyCache.clear();
}

export async function validateExtractorHash(args: ValidationArgs): Promise<ValidationResult> {
  const { req, endpoint, hash, payload, bypassKey, validatorName = DEFAULT_VALIDATOR } = args;

  const versionCode = getVersion(req);

  if (SKIP_IN_DEV && process.env.NODE_ENV === 'development') {
    recordMetric('dev-skip', endpoint, versionCode);
    return { valid: true, mode: 'dev-skip', versionCode };
  }

  const key = versionCode === null ? null : await getKey(validatorName, versionCode);

  if (key?.revoked) {
    recordMetric('revoked', endpoint, versionCode);
    return { valid: false, mode: 'invalid', versionCode };
  }

  if (bypassKey && process.env.TARNUM_KEY && bypassKey === process.env.TARNUM_KEY) {
    recordMetric('bypass', endpoint, versionCode);
    return { valid: true, mode: 'bypass', versionCode };
  }

  const hashValue = typeof hash === 'string' ? hash : '';

  if (hashValue && key?.secret && isValidExtractorHash(hashValue, payload, key.secret)) {
    recordMetric('new', endpoint, versionCode);
    return { valid: true, mode: 'new', versionCode };
  }

  if (
    process.env.ITEMDB_ACCEPT_LEGACY_EXTRACTOR_HASH !== 'false' &&
    hashValue &&
    checkHash(hashValue, payload)
  ) {
    recordMetric('legacy', endpoint, versionCode);
    return { valid: true, mode: 'legacy', versionCode };
  }

  recordMetric('invalid', endpoint, versionCode);
  return { valid: false, mode: 'invalid', versionCode };
}

export function createExtractorHash(payload: unknown, hashKey: string) {
  return objectHash.sha1({ payload: JSON.stringify(payload), hashKey });
}

export function isValidExtractorHash(hash: string, payload: unknown, hashKey: string) {
  const expected = createExtractorHash(payload, hashKey);
  const left = Buffer.from(hash, 'utf8');
  const right = Buffer.from(expected, 'utf8');

  if (left.length !== right.length) return false;

  return timingSafeEqual(left, right);
}

async function getKey(validatorName: string, versionCode: number) {
  const cacheId = `${validatorName}:${versionCode}`;
  const cached = keyCache.get(cacheId);

  if (cached && cached.expiresAt > Date.now()) {
    return cached;
  }

  try {
    const row = await prisma.hashValidationKey.findFirst({
      where: { validatorName, versionCode },
      select: { secret: true, active: true, revokedAt: true },
    });

    const entry = {
      secret: row?.active && !row.revokedAt ? row.secret : null,
      revoked: !!row && (!row.active || row.revokedAt !== null),
      expiresAt:
        Date.now() + (Number(process.env.HASH_VALIDATION_KEY_CACHE_TTL_MS) || KEY_CACHE_TTL),
    };

    keyCache.set(cacheId, entry);
    return entry;
  } catch {
    return { secret: null, revoked: false, expiresAt: 0 };
  }
}

function getVersion(req: NextApiRequest) {
  const header = req.headers['itemdb-version'];
  const raw = Array.isArray(header) ? header[0] : header;
  const version = Number(raw);

  return Number.isInteger(version) ? version : null;
}

function recordMetric(mode: HashValidationMode, endpoint: string, versionCode: number | null) {
  try {
    Sentry.metrics.count('extractor.hash_validation', 1, {
      attributes: {
        mode,
        endpoint,
        versionCode: versionCode?.toString() ?? 'unknown',
      },
    });
  } catch {
    // Metrics must never block extractor submissions.
  }
}
