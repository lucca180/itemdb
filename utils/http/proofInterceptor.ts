import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getCookie } from 'cookies-next/client';

const INTERCEPTOR_MARKER = Symbol.for('itemdb.proof-interceptor-id');

const SITE_PROOF_COOKIE = 'itemdb-proof';
const SITE_PROOF_HEADER = 'X-itemdb-Proof';
const PRIMARY_HOST = 'itemdb.com.br';

export const requestInterceptor = (config: InternalAxiosRequestConfig) => {
  if (!config || typeof window === 'undefined') return config;

  const rawUrl = config.url ?? '';
  if (!rawUrl) return config;

  let url: URL;
  try {
    url = new URL(rawUrl, window.location.origin);
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
  if (proof) config.headers[SITE_PROOF_HEADER] = proof;

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
