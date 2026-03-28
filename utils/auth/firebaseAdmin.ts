/**
 * Thin wrapper around firebase-admin used ONLY for verifying legacy Firebase
 * session cookies during the migration to JWT auth.
 *
 * Once all active sessions have naturally expired (13 days after the JWT
 * migration deploy), this file and firebase-admin can be removed entirely.
 */
import { existsSync } from 'fs';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const KEY_PATH = './firebase-key.json';

let initialized = false;

const getAdminAuth = () => {
  if (!existsSync(KEY_PATH)) return null;

  if (!initialized) {
    if (!getApps().length) initializeApp({ credential: cert(KEY_PATH) });
    initialized = true;
  }

  return getAuth();
};

/**
 * Verifies a Firebase session cookie.
 * Returns `{ uid, email }` on success, throws if invalid or key file is absent.
 */
export const verifyLegacyFirebaseSession = async (
  sessionCookie: string
): Promise<{ uid: string; email: string | undefined }> => {
  const auth = getAdminAuth();
  if (!auth) throw new Error('firebase-key.json not present — legacy auth unavailable');

  const decoded = await auth.verifySessionCookie(sessionCookie);
  return { uid: decoded.uid, email: decoded.email };
};
