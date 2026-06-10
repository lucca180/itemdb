import { SignJWT, jwtVerify } from 'jose';
import { UserRoles } from '../../types';

export const SESSION_VERSION = 2;

export type SessionPayload = {
  uid: string;
  email: string;
  role: UserRoles;
  sessionVersion: typeof SESSION_VERSION;
};

export type VerifiedSession = Omit<SessionPayload, 'sessionVersion'> & {
  sessionVersion?: SessionPayload['sessionVersion'];
  exp: number;
};

export const SESSION_DURATION_SECONDS = 100 * 24 * 60 * 60; // 100 days
const SESSION_REFRESH_THRESHOLD_SECONDS = 30 * 24 * 60 * 60; // refresh if < 30 days remain

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET env var is not set');
  return new TextEncoder().encode(secret);
};

export const signSession = async (payload: SessionPayload): Promise<string> => {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecret());
};

export const verifySession = async (token: string): Promise<VerifiedSession> => {
  const { payload } = await jwtVerify(token, getSecret());
  return payload as unknown as VerifiedSession;
};

/** Returns true when the session has less than 30 days remaining. */
export const needsRefresh = (exp: number): boolean => {
  const secondsRemaining = exp - Math.floor(Date.now() / 1000);
  return secondsRemaining < SESSION_REFRESH_THRESHOLD_SECONDS;
};
