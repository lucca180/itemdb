import { createHmac, timingSafeEqual } from 'crypto';

export function signWpPreviewToken(id: number, exp: number): string {
  const secret = process.env.WORDPRESS_PREVIEW_SECRET;
  if (!secret) throw new Error('WORDPRESS_PREVIEW_SECRET is not set');

  return createHmac('sha256', secret).update(`${id}.${exp}`).digest('hex');
}

export function verifyWpPreviewToken(id: number, token: string, exp: number): boolean {
  const secret = process.env.WORDPRESS_PREVIEW_SECRET;
  if (!secret || !token || !Number.isFinite(exp)) return false;
  if (exp * 1000 < Date.now()) return false;

  const expected = signWpPreviewToken(id, exp);
  const left = Buffer.from(token, 'utf8');
  const right = Buffer.from(expected, 'utf8');
  if (left.length !== right.length) return false;

  return timingSafeEqual(left, right);
}
