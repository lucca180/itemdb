import type { NextApiRequest } from 'next';
import { timingSafeEqual } from 'crypto';
import objectHash from 'object-hash';
import * as Sentry from '@sentry/nextjs';
import prisma from '@utils/prisma';
import { checkHash } from '@utils/hash';

export type HashValidationMode = 'new' | 'legacy' | 'invalid' | 'bypass' | 'dev-skip';

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

const DEFAULT_VALIDATOR_NAME = 'itemDataExtractor';
const SKIP_EXTRACTOR_HASH_VALIDATION_IN_DEV = false;

const legacySkipEndpoints = new Set(['items', 'items/open']);

export async function validateExtractorHash(args: ValidationArgs): Promise<ValidationResult> {
  const { req, endpoint, hash, payload, bypassKey, validatorName = DEFAULT_VALIDATOR_NAME } = args;

  const versionCode = getVersionCode(req);

  if (SKIP_EXTRACTOR_HASH_VALIDATION_IN_DEV && process.env.NODE_ENV === 'development') {
    recordHashValidationMetric('dev-skip', endpoint, versionCode);
    return { valid: true, mode: 'dev-skip', versionCode };
  }

  if (bypassKey && process.env.TARNUM_KEY && bypassKey === process.env.TARNUM_KEY) {
    recordHashValidationMetric('bypass', endpoint, versionCode);
    return { valid: true, mode: 'bypass', versionCode };
  }

  const hashValue = typeof hash === 'string' ? hash : '';

  if (versionCode !== null && hashValue) {
    const hashKey = await lookupHashValidationKey(validatorName, versionCode);

    if (hashKey && isValidExtractorHash(hashValue, payload, hashKey)) {
      recordHashValidationMetric('new', endpoint, versionCode);
      return { valid: true, mode: 'new', versionCode };
    }
  }

  if (
    acceptLegacyHash() &&
    ((hashValue && checkHash(hashValue, payload)) || legacySkipEndpoints.has(endpoint))
  ) {
    recordHashValidationMetric('legacy', endpoint, versionCode);
    return { valid: true, mode: 'legacy', versionCode };
  }

  recordHashValidationMetric('invalid', endpoint, versionCode);
  return { valid: false, mode: 'invalid', versionCode };
}

export function createExtractorHash(payload: unknown, hashKey: string) {
  return objectHash.sha1({ payload: JSON.stringify(payload), hashKey });
}

export function isValidExtractorHash(hash: string, payload: unknown, hashKey: string) {
  const expected = createExtractorHash(payload, hashKey);
  return timingSafeEqualString(hash, expected);
}

const hashValidationKeyCache = new Map<string, string | null>();
async function lookupHashValidationKey(validatorName: string, versionCode: number) {
  const cacheKey = `${validatorName}:${versionCode}`;
  const cached = hashValidationKeyCache.get(cacheKey);

  if (cached !== undefined) {
    return cached;
  }

  try {
    const validationKey = await prisma.hashValidationKey.findFirst({
      where: {
        validatorName,
        versionCode,
        active: true,
        revokedAt: null,
      },
      select: {
        secret: true,
      },
    });

    hashValidationKeyCache.set(cacheKey, validationKey?.secret ?? null);
    return validationKey?.secret ?? null;
  } catch {
    return null;
  }
}

function acceptLegacyHash() {
  return process.env.ITEMDB_ACCEPT_LEGACY_EXTRACTOR_HASH !== 'false';
}

function getVersionCode(req: NextApiRequest) {
  const header = req.headers['itemdb-version'];
  const raw = Array.isArray(header) ? header[0] : header;
  const versionCode = Number(raw);

  return Number.isInteger(versionCode) ? versionCode : null;
}

function recordHashValidationMetric(
  mode: HashValidationMode,
  endpoint: string,
  versionCode: number | null
) {
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

function timingSafeEqualString(left: string, right: string) {
  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');

  if (leftBuffer.length !== rightBuffer.length) return false;

  return timingSafeEqual(leftBuffer, rightBuffer);
}
