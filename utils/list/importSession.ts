import crypto from 'crypto';
import { redis } from '@utils/api/redis';

export type ListImportSession = {
  items: { [index: number | string]: number };
  indexType: string;
  list_id?: string | number | null;
  createdAt: number;
};

const LIST_IMPORT_SESSION_TTL_SECONDS = 5 * 60; // 5 minutes
const isDev = process.env.NODE_ENV === 'development';

type DevEntry = {
  session: ListImportSession;
  expires: number;
};

declare global {
  var __listImportSessionDevStore: Map<string, DevEntry> | undefined;
}

const devStore: Map<string, DevEntry> =
  globalThis.__listImportSessionDevStore ?? (globalThis.__listImportSessionDevStore = new Map());

const getImportSessionKey = (token: string) => `list-import:${token}`;

const cleanupDevStore = () => {
  const now = Date.now();

  for (const [token, entry] of devStore.entries()) {
    if (entry.expires < now) devStore.delete(token);
  }
};

export const createListImportSession = async (
  session: Omit<ListImportSession, 'createdAt'>
): Promise<string> => {
  const token = crypto.randomBytes(24).toString('hex');
  const entry: ListImportSession = {
    ...session,
    createdAt: Date.now(),
  };

  if (isDev || !redis) {
    cleanupDevStore();
    devStore.set(token, {
      session: entry,
      expires: Date.now() + LIST_IMPORT_SESSION_TTL_SECONDS * 1000,
    });
    return token;
  }

  await redis.set(
    getImportSessionKey(token),
    JSON.stringify(entry),
    'EX',
    LIST_IMPORT_SESSION_TTL_SECONDS
  );

  return token;
};

export const getListImportSession = async (token: string): Promise<ListImportSession | null> => {
  if (!token) return null;

  if (isDev || !redis) {
    cleanupDevStore();
    const entry = devStore.get(token);
    if (!entry) return null;

    if (entry.expires < Date.now()) {
      devStore.delete(token);
      return null;
    }

    return entry.session;
  }

  const sessionRaw = await redis.get(getImportSessionKey(token));
  if (!sessionRaw) return null;

  return JSON.parse(sessionRaw) as ListImportSession;
};
