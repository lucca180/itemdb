import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import ipaddr from 'ipaddr.js';
import { NextApiRequest } from 'next';
import { ListService } from '@services/ListService';
import { Chance } from 'chance';
import { createHash, randomBytes } from 'crypto';

const chance = new Chance();

// ------- site proof ---------- //
const DEFAULT_SITE_PROOF_DIFFICULTY = 8;
const MAX_SITE_PROOF_DIFFICULTY = 24;
const SITE_PROOF_VERSION = 2;

type SiteProofContext = {
  method?: string | null;
  pathname?: string | null;
};

type SiteProofPayload = jwt.JwtPayload & {
  ctx?: string;
  nonce?: string;
  difficulty?: number;
  v?: number;
};

export function generateSiteProof(type = 'short') {
  const expiration = type === 'short' ? 5 : 30;
  return {
    token: jwt.sign(
      {
        aud: 'itemdb.com.br',
        ctx: 'site-proof',
        difficulty: getSiteProofDifficulty(),
        nonce: randomBytes(16).toString('base64url'),
        v: SITE_PROOF_VERSION,
      },
      process.env.SITE_PROOF_SECRET!,
      { expiresIn: type === 'short' ? '5m' : '30m' }
    ),
    expiresIn: expiration * 60,
  };
}

export function verifySiteChallenge(challenge: string, maxAge = 0) {
  const payload = decodeSiteChallenge(challenge, maxAge);
  return !!payload;
}

export function verifySiteProof(proof: string, maxAge = 0, context: SiteProofContext = {}) {
  if (!proof) return false;

  const separatorIndex = proof.lastIndexOf(':');
  if (separatorIndex <= 0 || separatorIndex === proof.length - 1) {
    return false;
  }

  const challenge = proof.slice(0, separatorIndex);
  const solution = proof.slice(separatorIndex + 1);
  if (!/^\d+$/.test(solution)) return false;

  const payload = decodeSiteChallenge(challenge, maxAge);
  if (!payload) return false;

  const difficulty = Number(payload.difficulty);
  if (!Number.isInteger(difficulty) || difficulty < 0 || difficulty > 30) return false;

  const proofInput = getSiteProofInput(challenge, solution, context);
  const hash = createHash('sha256').update(proofInput).digest();

  return hasLeadingZeroBits(hash, difficulty);
}

function decodeSiteChallenge(challenge: string, maxAge = 0) {
  try {
    const payload = jwt.verify(challenge, process.env.SITE_PROOF_SECRET!) as SiteProofPayload;

    if (
      payload.aud !== 'itemdb.com.br' ||
      payload.ctx !== 'site-proof' ||
      payload.v !== SITE_PROOF_VERSION ||
      !payload.nonce
    ) {
      return false;
    }

    // check if expiration is close
    const now = Math.floor(Date.now() / 1000);
    if (maxAge && payload.exp && payload.exp - now < maxAge) {
      return false;
    }

    return payload;
  } catch {
    return false;
  }
}

export function getSiteProofInput(
  challenge: string,
  solution: string | number,
  context: SiteProofContext = {}
) {
  const method = (context.method || 'GET').toUpperCase();
  const pathname = context.pathname || '/';

  return `${challenge}.${method}.${pathname}.${solution}`;
}

function hasLeadingZeroBits(hash: Uint8Array | Buffer, bits: number) {
  let remaining = bits;

  for (const byte of hash) {
    if (remaining <= 0) return true;
    if (remaining >= 8) {
      if (byte !== 0) return false;
      remaining -= 8;
      continue;
    }

    return byte >> (8 - remaining) === 0;
  }

  return true;
}

function getSiteProofDifficulty() {
  const value = Number(process.env.SITE_PROOF_DIFFICULTY || DEFAULT_SITE_PROOF_DIFFICULTY);
  if (!Number.isFinite(value)) return DEFAULT_SITE_PROOF_DIFFICULTY;

  return Math.max(0, Math.min(Math.floor(value), MAX_SITE_PROOF_DIFFICULTY));
}

// -------- user session ---------- //

export function generateSessionToken(limit: number, expires: number = 7 * 24 * 60 * 60) {
  return jwt.sign(
    {
      sub: chance.guid({ version: 5 }),
      aud: 'itemdb.com.br',
      ctx: 'session',
      limit: limit,
    },
    process.env.SITE_PROOF_SECRET!,
    { expiresIn: `${expires}s` }
  );
}

export function verifySessionToken(token: string) {
  try {
    const payload = jwt.verify(token, process.env.SITE_PROOF_SECRET!) as jwt.JwtPayload;

    if (payload.aud !== 'itemdb.com.br' || payload.ctx !== 'session') {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function isLikelyBrowser(req: NextRequest | NextApiRequest) {
  let score = 0;

  const getHeader = (name: string) => {
    const nextRequestHeader = (req as NextRequest).headers?.get?.(name);
    if (typeof nextRequestHeader === 'string') {
      return nextRequestHeader;
    }

    const apiRequestHeader = (req as NextApiRequest).headers?.[name.toLowerCase()];
    if (Array.isArray(apiRequestHeader)) {
      return apiRequestHeader.join(', ');
    }

    return apiRequestHeader;
  };

  const userAgent = getHeader('user-agent') || '';
  const secFetchSite = getHeader('sec-fetch-site');
  const secFetchMode = getHeader('sec-fetch-mode');
  const secFetchDest = getHeader('sec-fetch-dest');
  const acceptLanguage = getHeader('accept-language');
  const accept = getHeader('accept');
  const origin = getHeader('origin');
  const referer = getHeader('referer');
  const ifNoneMatch = getHeader('if-none-match');

  if (secFetchSite && secFetchMode && secFetchDest) {
    score += 3;

    if (
      ['same-origin', 'same-site', 'cross-site', 'none'].includes(secFetchSite) &&
      ['navigate', 'cors'].includes(secFetchMode)
    ) {
      score += 1;
    }
  }

  if (ifNoneMatch) {
    score += 1;
  }

  if (acceptLanguage) {
    const langs = acceptLanguage
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    if (langs.length >= 1) {
      score += 1;
    }
    if (langs.length >= 2) {
      score += 1;
    }
  }

  if (accept && accept.includes('text/html')) {
    score += 2;
  } else if (accept && accept !== '*/*') {
    score += 1;
  }

  if (/Mozilla\/5\.0.*(?:Chrome|Firefox|Safari|Edg|OPR|SamsungBrowser)/.test(userAgent)) {
    score += 1;
  }

  if (origin || referer) {
    score += 1;
  }

  if (accept === '*/*') {
    score -= 1;
  }

  if (!userAgent || /curl|postman|insomnia|python|axios|fetch|requests/i.test(userAgent)) {
    score -= 3;
  }

  if (!acceptLanguage) {
    score -= 1;
  }

  const finalScore = Math.max(0, score);

  return {
    isLikely: finalScore >= 5,
    score: finalScore,
  };
}

export function normalizeIP(ip: string) {
  if (!ip) return ip;
  try {
    const addr = ipaddr.parse(ip);

    if (addr.kind() === 'ipv6') {
      const parts = (addr as ipaddr.IPv6).parts.slice(0, 4);
      return parts.join(':') + '::/64';
    }

    return ip;
  } catch (e) {
    return ip;
  }
}

// -------- api token ---------- //

export function verifyApiToken(token: string) {
  try {
    const payload = jwt.verify(token, process.env.SITE_PROOF_SECRET!) as jwt.JwtPayload;

    if (payload.aud !== 'itemdb.com.br' || payload.ctx !== 'api-token') {
      return false;
    }

    return payload;
  } catch {
    return false;
  }
}

// -------- search lists -------- //

export async function generateListJWT(listId: number, req: NextApiRequest) {
  const listService = await ListService.initReq(req);
  const list = await listService.getList({
    listId: listId,
    username: 'official',
  });

  if (!list) return null;

  const token = jwt.sign(
    {
      aud: 'itemdb.com.br',
      listId,
      ctx: 'list_access',
    },
    process.env.SITE_PROOF_SECRET!,
    { expiresIn: '15m' }
  );

  return { token, list };
}

export function verifyListJWT(token: string, list_id: number) {
  try {
    const payload = jwt.verify(token, process.env.SITE_PROOF_SECRET!) as jwt.JwtPayload;

    if (
      payload.aud !== 'itemdb.com.br' ||
      payload.ctx !== 'list_access' ||
      payload.listId !== list_id
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
