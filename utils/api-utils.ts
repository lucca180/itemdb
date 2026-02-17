import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import ipaddr from 'ipaddr.js';

// ------- site proof ---------- //
export function generateSiteProof(ip?: string) {
  return jwt.sign(
    {
      aud: 'itemdb.com.br',
      ip: ip || null,
      ctx: 'browser',
    },
    process.env.SITE_PROOF_SECRET!,
    { expiresIn: '30m' }
  );
}

export function verifySiteProof(proof: string, ip?: string) {
  try {
    const payload = jwt.verify(proof, process.env.SITE_PROOF_SECRET!) as jwt.JwtPayload;

    if (payload.aud !== 'itemdb.com.br') {
      return false;
    }

    if (ip && payload.ip && payload.ip !== ip) {
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

  if (secFetchSite && secFetchMode && secFetchDest) {
    score += 2;
  }

  if (acceptLanguage && acceptLanguage.includes(',')) {
    score += 1;
  }

  if (accept?.includes('application/json')) {
    score += 1;
  }

  if (/Chrome|Firefox|Safari|Edg/.test(userAgent)) {
    score += 1;
  }

  if (origin) {
    score += 1;
  }

  return {
    isLikely: score >= 3,
    score,
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
