import { atom } from 'jotai';

/**
 * Where a login prompt was opened from. Also sent as `source` in the Umami login funnel and
 * accepted by the `?login=<source>` URL param. A source can have its own modal copy in
 * `LOGIN_VARIANTS` (components/Modal/loginModalVariants.ts).
 */
export const LOGIN_SOURCES = [
  'header',
  'login-page',
  'url',
  'restock-dashboard',
  'add-to-list',
  'import',
  'search',
  'checklist',
  'nc-report',
  'troubleshooting',
] as const;

export type LoginSource = (typeof LOGIN_SOURCES)[number];

export type LoginRequest = {
  source: LoginSource;
  /** Page the user returns to after logging in (pathname only). */
  redirectPath?: string;
  /**
   * The exact UI element that asked for login (e.g. `item-ctx-menu`), sent with the funnel
   * events. Needed when one source has several entry points.
   */
  trigger?: string;
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
