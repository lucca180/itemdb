import crypto from 'crypto';

const MAGIC_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes
const isDev = process.env.NODE_ENV === 'development';
// ---------------------------------------------------------------------------
// Dev-mode in-memory store — no Redis needed for local development
// Attached to globalThis so it survives Next.js hot reloads.
// ---------------------------------------------------------------------------
type DevEntry = { email: string; expires: number };
declare global {
  var __magicLinkDevStore: Map<string, DevEntry> | undefined;
}
const devStore: Map<string, DevEntry> =
  globalThis.__magicLinkDevStore ?? (globalThis.__magicLinkDevStore = new Map());

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

const generateToken = () => crypto.randomBytes(32).toString('hex');

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Creates a magic link token for the given email.
 * - Production: stored as sha256(token) → email in Redis with 15-min TTL.
 * - Development: stored in an in-memory Map; the full link is printed to the terminal.
 */
export const createMagicToken = async (email: string, origin: string): Promise<string> => {
  const token = generateToken();
  const hash = hashToken(token);
  const link = `${origin}/login?token=${token}&email=${encodeURIComponent(email)}`;

  if (isDev) {
    devStore.set(hash, { email, expires: Date.now() + MAGIC_TOKEN_TTL_SECONDS * 1000 });
    console.warn('\n[itemdb] Magic login link (dev only):\n', link, '\n');
    return token;
  }

  const { redis } = await import('../redis');
  if (!redis) throw new Error('Redis is not configured');

  await redis.set(`magic:${hash}`, email, 'EX', MAGIC_TOKEN_TTL_SECONDS);

  return token;
};

/**
 * Validates and consumes a magic link token.
 * Throws on failure (invalid, expired, or email mismatch).
 */
export const consumeMagicToken = async (token: string, email: string): Promise<void> => {
  const hash = hashToken(token);

  if (isDev) {
    const entry = devStore.get(hash);
    if (!entry) throw new Error('Invalid or expired token');
    if (entry.expires < Date.now()) {
      devStore.delete(hash);
      throw new Error('Token expired');
    }
    if (entry.email.toLowerCase() !== email.toLowerCase()) throw new Error('Email mismatch');
    devStore.delete(hash);
    return;
  }

  const { redis } = await import('../redis');
  if (!redis) throw new Error('Redis is not configured');

  const key = `magic:${hash}`;
  const storedEmail = await redis.get(key);

  if (!storedEmail) throw new Error('Invalid or expired token');
  if (storedEmail.toLowerCase() !== email.toLowerCase()) throw new Error('Email mismatch');

  await redis.del(key);
};
