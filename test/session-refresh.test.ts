import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

const checkAuthMock = vi.hoisted(() => vi.fn());

vi.mock('@utils/prisma', () => ({ default: { user: { update: vi.fn() } } }));
vi.mock('@utils/googleCloud', () => ({ CheckAuth: checkAuthMock }));

import { getCurrentUser } from '@utils/auth/getCurrentUser';
import { SESSION_DURATION_SECONDS, SESSION_VERSION, verifySession } from '@utils/auth/jwt';

const DAY = 24 * 60 * 60;
const USER = { id: 'user-id', email: 'user@example.com', role: 'USER' };
const nowSeconds = () => Math.floor(Date.now() / 1000);

const originalSecret = process.env.JWT_SECRET;

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret';
});

afterAll(() => {
  process.env.JWT_SECRET = originalSecret;
});

beforeEach(() => {
  checkAuthMock.mockReset();
});

function mockSession(daysLeft: number, sessionVersion: number | undefined = SESSION_VERSION) {
  checkAuthMock.mockResolvedValue({
    user: USER,
    decodedToken: { ...USER, uid: USER.id, sessionVersion, exp: nowSeconds() + daysLeft * DAY },
  });
}

describe('getCurrentUser session refresh', () => {
  test('keeps the cookie when plenty of time remains', async () => {
    mockSession(60);

    const { user, refreshedSessionCookie } = await getCurrentUser({ sessionCookie: 'jwt' });

    expect(user).toEqual(USER);
    expect(refreshedSessionCookie).toBeNull();
  });

  test('re-issues the cookie inside the refresh window', async () => {
    mockSession(10);

    const { refreshedSessionCookie } = await getCurrentUser({ sessionCookie: 'jwt' });

    expect(refreshedSessionCookie).toMatch(/^session=[^;]+;Path=\/;HttpOnly;Secure;SameSite=Lax;/);
    expect(refreshedSessionCookie).toContain(`Max-Age=${SESSION_DURATION_SECONDS};`);

    const token = refreshedSessionCookie!.split(';')[0].replace('session=', '');
    const payload = await verifySession(token);

    expect(payload.uid).toBe(USER.id);
    expect(payload.sessionVersion).toBe(SESSION_VERSION);
    expect(payload.exp - nowSeconds()).toBeGreaterThan(SESSION_DURATION_SECONDS - 60);
  });

  test('re-issues the cookie for an outdated session version', async () => {
    mockSession(60, SESSION_VERSION - 1);

    const { refreshedSessionCookie } = await getCurrentUser({ sessionCookie: 'jwt' });

    expect(refreshedSessionCookie).not.toBeNull();
  });

  test('returns nothing without a valid session', async () => {
    checkAuthMock.mockResolvedValue({ user: null, decodedToken: null });

    const result = await getCurrentUser({ sessionCookie: 'jwt' });

    expect(result).toEqual({ user: null, refreshedSessionCookie: null });
  });
});
