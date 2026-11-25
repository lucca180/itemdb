import { describe, expect, test } from 'vitest';
import { NextRequest } from 'next/server';
import { getClientIp, type ClientIpSource } from '@utils/api/clientIp';

type Build = (headers: Record<string, string>) => ClientIpSource;

const SPOOFED = {
  'x-client-ip': '1.1.1.1',
  'x-forwarded-for': '2.2.2.2, 3.3.3.3',
};

const sources: [string, Build][] = [
  ['await headers()', (headers) => new Headers(headers)],
  ['Request', (headers) => new Request('http://localhost/', { headers })],
  ['NextRequest', (headers) => new NextRequest('http://localhost/', { headers })],
  ['Pages API request', (headers) => ({ headers })],
];

describe.each(sources)('getClientIp with %s', (_name, build) => {
  test('Cloudflare wins over client-controlled headers', () => {
    expect(getClientIp(build({ ...SPOOFED, 'cf-connecting-ip': '9.9.9.9' }))).toBe('9.9.9.9');
  });

  test('accepts an IPv6 from Cloudflare', () => {
    expect(getClientIp(build({ ...SPOOFED, 'cf-connecting-ip': '2001:db8::1' }))).toBe(
      '2001:db8::1'
    );
  });

  test('ignores an invalid Cloudflare value and falls back to request-ip', () => {
    expect(
      getClientIp(build({ 'x-forwarded-for': '2.2.2.2', 'cf-connecting-ip': 'not-an-ip' }))
    ).toBe('2.2.2.2');
  });

  test('falls back to request-ip without Cloudflare', () => {
    expect(getClientIp(build({ 'x-forwarded-for': '2.2.2.2, 3.3.3.3' }))).toBe('2.2.2.2');
  });

  test('falls back to the raw first x-forwarded-for value', () => {
    expect(getClientIp(build({ 'x-forwarded-for': 'local-id, other' }))).toBe('local-id');
  });

  test('returns null when nothing identifies the client', () => {
    expect(getClientIp(build({}))).toBeNull();
  });
});

test('getClientIp uses the socket address when no header matches', () => {
  const req = { headers: {}, socket: { remoteAddress: '4.4.4.4' } };
  expect(getClientIp(req)).toBe('4.4.4.4');
});
