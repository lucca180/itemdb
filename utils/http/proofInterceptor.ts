import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getCookie } from 'cookies-next/client';

const INTERCEPTOR_MARKER = Symbol.for('itemdb.proof-interceptor-id');

const SITE_PROOF_COOKIE = 'itemdb-proof';
const SITE_PROOF_HEADER = 'X-itemdb-Proof';
const PRIMARY_HOST = 'itemdb.com.br';

type SiteProofPayload = {
  difficulty?: number;
};

const proofCache = new Map<string, string>();
const textEncoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;

export const requestInterceptor = async (config: InternalAxiosRequestConfig) => {
  if (!config || typeof window === 'undefined') return config;

  const rawUrl = config.url ?? '';
  if (!rawUrl) return config;

  let url: URL;
  try {
    const baseUrl = config.baseURL
      ? new URL(config.baseURL, window.location.origin)
      : new URL('/', window.location.origin);
    url = new URL(rawUrl, baseUrl);
  } catch {
    return config;
  }

  const hostname = url.hostname.toLowerCase();
  const isTrustedHost =
    url.origin === window.location.origin ||
    hostname === PRIMARY_HOST ||
    hostname.endsWith(`.${PRIMARY_HOST}`);

  if (!isTrustedHost) return config;

  const proof = getCookie(SITE_PROOF_COOKIE);
  if (proof) {
    const solvedProof = await solveSiteProof(String(proof), config.method, url.pathname);
    if (solvedProof) {
      setHeader(config, SITE_PROOF_HEADER, solvedProof);
      setHeader(config, 'X-Requested-With', 'itemdb-web');
    }
  }

  console.error('Site proof not found. Unable to attach site proof to request.');

  return config;
};

export const installProofInterceptor = (client: AxiosInstance = axios) => {
  const markerClient = client as AxiosInstance & { [INTERCEPTOR_MARKER]?: number };
  const existing = markerClient[INTERCEPTOR_MARKER];
  if (existing !== undefined) {
    return () => {};
  }

  const interceptorId = client.interceptors.request.use((config) => requestInterceptor(config));
  markerClient[INTERCEPTOR_MARKER] = interceptorId;

  return () => {
    const current = markerClient[INTERCEPTOR_MARKER];
    if (current === undefined) return;

    client.interceptors.request.eject(current);
    delete markerClient[INTERCEPTOR_MARKER];
  };
};

async function solveSiteProof(challenge: string, method = 'GET', pathname = '/') {
  if (!textEncoder || !globalThis.crypto?.subtle) return null;

  const payload = decodeChallengePayload(challenge);
  const difficulty = Number(payload?.difficulty);
  if (!Number.isInteger(difficulty) || difficulty < 0 || difficulty > 24) return null;

  const normalizedMethod = method.toUpperCase();
  const cacheKey = `${challenge}:${normalizedMethod}:${pathname}`;
  const cached = proofCache.get(cacheKey);
  if (cached) return cached;

  const maxAttempts = Math.max(1, Math.min(2 ** (difficulty + 4), 10_000_000));

  for (let counter = 0; counter < maxAttempts; counter++) {
    const input = `${challenge}.${normalizedMethod}.${pathname}.${counter}`;
    const digest = await globalThis.crypto.subtle.digest('SHA-256', textEncoder.encode(input));

    if (hasLeadingZeroBits(new Uint8Array(digest), difficulty)) {
      const solvedProof = `${challenge}:${counter}`;
      proofCache.set(cacheKey, solvedProof);
      return solvedProof;
    }
  }

  return null;
}

function decodeChallengePayload(challenge: string): SiteProofPayload | null {
  try {
    const payload = challenge.split('.')[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');

    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function hasLeadingZeroBits(hash: Uint8Array, bits: number) {
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

function setHeader(config: InternalAxiosRequestConfig, name: string, value: string) {
  if (typeof config.headers?.set === 'function') {
    config.headers.set(name, value);
    return;
  }

  config.headers[name] = value;
}
