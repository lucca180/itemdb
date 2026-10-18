import { useState, useEffect, useContext, createContext, useCallback, ReactNode } from 'react';
import { atom, useAtom, useSetAtom } from 'jotai';
import { atomWithStorage, useHydrateAtoms } from 'jotai/utils';
import { User, UserPreferences } from '@types';
import axios from 'axios';
import { notifyApiSessionSettled, waitForApiSession } from '@utils/api/apiSessionGate';
import { bootstrapApiSession } from '@utils/api/turnstileSession';
import { loginRequestAtom, type LoginSource, type OpenLoginOptions } from '@utils/loginModal';

type AuthContextType = {
  user: User | null;
  signout: () => Promise<void>;
  authLoading: boolean;
  apiSessionReady: boolean;
  waitForApiSession: () => Promise<void>;
  setUser: (user: User | null) => void;
  /** App Router: apply SSR user from LayoutAuth (no /api/auth/me). */
  hydrateFromSSR: (user: User | null) => void;
  updatePref: (key: keyof UserPreferences, value: UserPreferences[keyof UserPreferences]) => void;
  userPref: UserPreferences | null;
  resetUser: () => Promise<void>;
  /** Opens the global login modal (rendered once by GlobalLoginModal). */
  openLogin: (source: LoginSource, options?: OpenLoginOptions) => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,

  signout: async () => {},
  authLoading: true,
  apiSessionReady: false,
  waitForApiSession,

  setUser: () => {},
  hydrateFromSSR: () => {},
  updatePref: () => {},
  userPref: null,
  resetUser: async () => {},
  openLogin: () => {},
});

const UserState = atom<User | null | undefined>(null);
export const UserPrefs = atomWithStorage<UserPreferences | null>('UserPrefs', null);

type AuthProviderProps = {
  children: ReactNode;
  initialUser?: User | null;
  /**
   * When false (App Router), skip /api/auth/me — LayoutAuth hydrates from SSR.
   * Pages Router keeps the default true.
   */
  clientAuthSync?: boolean;
};

export function AuthProvider({ children, initialUser, clientAuthSync = true }: AuthProviderProps) {
  useHydrateAtoms([[UserState, initialUser]]);
  const [user, setUser] = useAtom(UserState);
  const [userPref, setUserPref] = useAtom(UserPrefs);
  const [authLoading, setAuthLoading] = useState<boolean>(
    clientAuthSync && typeof initialUser === 'undefined'
  );
  const [apiSessionReady, setApiSessionReady] = useState(false);
  const setLoginRequest = useSetAtom(loginRequestAtom);

  // stable, and the modal state lives in its own atom: opening it doesn't re-render useAuth users
  const openLogin = useCallback(
    (source: LoginSource, options?: OpenLoginOptions) => setLoginRequest({ source, ...options }),
    [setLoginRequest]
  );

  const signout = async () => {
    await axios.post('/api/auth/logout');
    await resetUser();
    location.reload();
  };

  const hydrateFromSSR = useCallback(
    (ssrUser: User | null) => {
      setUser(ssrUser);
      setAuthLoading(false);
    },
    [setUser]
  );

  useEffect(() => {
    let isMounted = true;

    // Always bootstrap the API rate-limit session (App Router SSR sets initialUser,
    // so this must not be gated on auth sync).
    const ensureApiSession = async () => {
      try {
        await bootstrapApiSession();
      } catch (e) {
        console.error('getSession error', e);
      } finally {
        notifyApiSessionSettled();
        if (isMounted) setApiSessionReady(true);
      }
    };

    void ensureApiSession();

    const syncFromClientApi = async () => {
      try {
        const res = await axios.get('/api/auth/me');
        const userData = res.data as User;

        if (!isMounted || (user && checkEqual(userData, user))) return;
        setUser(userData);
      } catch {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    };

    // App Router: LayoutAuthServer → LayoutAuth.hydrateFromSSR — never /api/auth/me.
    // Pages Router: no SSR auth slot → client sync when initialUser is omitted.
    if (!clientAuthSync || typeof initialUser !== 'undefined') {
      setAuthLoading(false);
    } else {
      void syncFromClientApi();
    }

    return () => {
      isMounted = false;
    };
  }, [clientAuthSync, initialUser]);

  const updatePref = (
    key: keyof UserPreferences,
    value: UserPreferences[keyof UserPreferences]
  ) => {
    setUserPref((prev) => ({ ...(prev ?? undefined), [key]: value }));
  };

  const resetUser = async () => {
    setUser(null);
    setUserPref(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        signout,
        authLoading,
        apiSessionReady,
        waitForApiSession,
        setUser,
        hydrateFromSSR,
        updatePref,
        userPref,
        resetUser,
        openLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * App Router: re-issues the `session` cookie through /api/auth/me, which refreshes it when it's
 * near expiry. Server Components can't set cookies, so the SSR refresh would be dropped.
 */
export const refreshSessionCookie = () =>
  axios
    .get('/api/auth/me')
    .then(() => {})
    .catch(() => {});

export const useAuth = () => {
  return useContext(AuthContext);
};

const checkEqual = (a: object, b: object) => {
  return JSON.stringify(a) === JSON.stringify(b);
};
