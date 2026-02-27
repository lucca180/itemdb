import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import ipaddr from 'ipaddr.js';
import { NextApiRequest } from 'next';
import { ListService } from '@services/ListService';

// ------- site proof ---------- //
export function generateSiteProof(ip?: string, type = 'short') {
  const expiration = type === 'short' ? 5 : 30;
  return {
    token: jwt.sign(
      {
        aud: 'itemdb.com.br',
        ip: ip || null,
        ctx: 'browser',
      },
      process.env.SITE_PROOF_SECRET!,
      { expiresIn: type === 'short' ? '5m' : '30m' }
    ),
    expiresIn: expiration * 60,
  };
}

export function verifySiteProof(proof: string, maxAge = 0) {
  try {
    const payload = jwt.verify(proof, process.env.SITE_PROOF_SECRET!) as jwt.JwtPayload;

    if (payload.aud !== 'itemdb.com.br') {
      return false;
    }

    // check if expiration is close
    const now = Math.floor(Date.now() / 1000);
    if (maxAge && payload.exp && payload.exp - now < maxAge) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// -------- user session ---------- //

export function isLikelyBrowser(req: NextRequest) {
  let score = 0;
  const headers = req.headers;

  const userAgent = headers.get('user-agent') || '';
  const secFetchSite = headers.get('sec-fetch-site');
  const secFetchMode = headers.get('sec-fetch-mode');
  const secFetchDest = headers.get('sec-fetch-dest');
  const acceptLanguage = headers.get('accept-language');
  const accept = headers.get('accept');
  const origin = headers.get('origin');
  const referer = headers.get('referer');

  if (secFetchSite && secFetchMode && secFetchDest) {
    score += 3;

    if (
      ['same-origin', 'same-site', 'cross-site', 'none'].includes(secFetchSite) &&
      ['navigate', 'cors', 'no-cors'].includes(secFetchMode)
    ) {
      score += 1;
    }
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

  if (/Mozilla\/5\.0.*(?:Chrome|Firefox|Safari|Edg)/.test(userAgent)) {
    score += 1;
  }

  if (origin || referer) {
    score += 1;
  }

  if (accept === '*/*') {
    score -= 2;
  }

  if (!userAgent || /curl|postman|insomnia|python|axios|fetch/i.test(userAgent)) {
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

export function verifyListJWT(token: string) {
  try {
    const payload = jwt.verify(token, process.env.SITE_PROOF_SECRET!) as jwt.JwtPayload;

    if (payload.aud !== 'itemdb.com.br' || payload.ctx !== 'list_access') {
      return null;
    }

    return payload.listId as number;
  } catch {
    return null;
  }
}
