import { atom } from 'jotai';

/**
 * Where a login prompt was opened from. Also sent as `source` in the Umami login funnel and
 * accepted by the `?login=<source>` URL param. Add new sources here as callers are wired up.
 */
export const LOGIN_SOURCES = ['header', 'login-page', 'restock-dashboard', 'url'] as const;

export type LoginSource = (typeof LOGIN_SOURCES)[number];

export type LoginRequest = {
  source: LoginSource;
  /** Page the user returns to after logging in (pathname only). */
  redirectPath?: string;
  /** Runs after the modal closes. */
  onClose?: () => void;
};

export type OpenLoginOptions = Omit<LoginRequest, 'source'>;

/** The open login modal request (rendered once by GlobalLoginModal); `null` when closed. */
export const loginRequestAtom = atom<LoginRequest | null>(null);

/** `?login=` value → known source; any other non-empty value is tracked as `url`. */
export function parseLoginSource(value: string | null): LoginSource | null {
  if (!value) return null;

  return (LOGIN_SOURCES as readonly string[]).includes(value) ? (value as LoginSource) : 'url';
}
