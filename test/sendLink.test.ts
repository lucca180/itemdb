import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

const prismaMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
}));
const createMagicTokenMock = vi.hoisted(() => vi.fn());
const consumeLoginRateLimitMock = vi.hoisted(() => vi.fn());

vi.mock('@utils/prisma', () => ({ default: prismaMock }));
vi.mock('@utils/auth/magicLink', () => ({ createMagicToken: createMagicTokenMock }));
vi.mock('@utils/auth/loginRateLimit', () => ({
  consumeLoginRateLimit: consumeLoginRateLimitMock,
}));
vi.mock('@utils/email', () => ({ getEmail: () => ({ html: '', text: '' }) }));
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: vi.fn() };
  },
}));
vi.mock('request-ip', () => ({
  default: { getClientIp: () => '1.2.3.4' },
}));

import handle from '../pages/api/auth/sendLink';

function mockRes() {
  const res = {
    statusCode: 200,
    body: null as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: unknown) {
      this.body = data;
      return this;
    },
  };
  return res as typeof res & NextApiResponse;
}

const req = (body: Record<string, unknown>) => ({ method: 'POST', body }) as NextApiRequest;

describe('POST /api/auth/sendLink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = 'test-resend-key';
    consumeLoginRateLimitMock.mockResolvedValue({
      allowed: true,
      remaining: 4,
      retryAfterSeconds: 900,
    });
    createMagicTokenMock.mockResolvedValue('magic-token');
  });

  test('unknown email asks for confirmation and does not send', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const res = mockRes();

    await handle(req({ cred: 'new@example.com' }), res);

    expect(res.body).toMatchObject({ needsConfirmation: true, accountExists: false });
    expect(createMagicTokenMock).not.toHaveBeenCalled();
  });

  test('unknown email sends when confirmNewAccount is true', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const res = mockRes();

    await handle(req({ cred: 'new@example.com', confirmNewAccount: true }), res);

    expect(res.body).not.toHaveProperty('needsConfirmation');
    expect(createMagicTokenMock).toHaveBeenCalledOnce();
  });

  test('username miss stays opaque and does not send', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const res = mockRes();

    await handle(req({ cred: 'missing_user' }), res);

    expect(res.body).toMatchObject({ mode: 'username' });
    expect(res.body).not.toHaveProperty('accountExists');
    expect(createMagicTokenMock).not.toHaveBeenCalled();
  });

  test('rate limit returns 429 before lookup or send', async () => {
    consumeLoginRateLimitMock.mockResolvedValue({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 420,
    });
    const res = mockRes();

    await handle(req({ cred: 'anyone@example.com' }), res);

    expect(res.statusCode).toBe(429);
    expect(res.body).toMatchObject({ code: 'rate-limited' });
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    expect(createMagicTokenMock).not.toHaveBeenCalled();
  });
});
