import React, { useState, useEffect, useContext, createContext } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { useAtom } from 'jotai';
import { atomWithStorage, createJSONStorage } from 'jotai/utils';
import { User, UserPreferences } from '../types';
import axios from 'axios';
import { getCookie } from 'cookies-next/client';
import { captureException } from '@sentry/nextjs';

const getAuth = () => import('./firebase/auth');

type AuthContextType = {
  user: User | null;
  userToken: string | null;
  signout: () => Promise<void>;
  authLoading: boolean;
  setUser: (user: User) => void;
  updatePref: (key: keyof UserPreferences, value: UserPreferences[keyof UserPreferences]) => void;
  userPref: UserPreferences | null;
  resetUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  userToken: null,

  signout: async () => {},
  authLoading: true,

  setUser: () => {},
  updatePref: () => {},
  userPref: null,
  resetUser: async () => {},
});

const storageLocal = createJSONStorage<UserPreferences | null>(() => localStorage);
const storageSession = createJSONStorage<User | null>(() => sessionStorage);

export const UserState = atomWithStorage<User | null>('UserState', null, storageSession);

export const UserPrefs = atomWithStorage<UserPreferences | null>('UserPrefs', null, storageLocal);

let isDoingLogin = false;

export function AuthProvider({ children }: any) {
  const [user, setUser] = useAtom(UserState);
  const [userPref, setUserPref] = useAtom(UserPrefs);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubs = getAuth().then((res) => {
      const { auth } = res;

      return auth.onIdTokenChanged(async (newUser) => {
        if (!newUser) {
          setUserToken(null);
          setAuthLoading(false);
          getSession();
          return;
        }

        if (newUser && newUser.uid !== user?.id) {
          await doLogin(newUser);
        }

        const token = await newUser.getIdToken();
        getSession();
        setUserToken(token);
        setAuthLoading(false);
      });
    });

    return () => {
      unsubs.then((unsubs) => unsubs());
    };
  }, []);

  // force refresh the token every 10 minutes
  useEffect(() => {
    const handle = setInterval(
      async () => {
        if (document.visibilityState !== 'visible') return;
        getAuth().then(async (res) => {
          const { auth } = res;
          const user = auth.currentUser;

          try {
            if (user) await user.getIdToken(true);
          } catch (e) {
          } finally {
            await getSession();
            checkProof();
          }
        });
      },
      15 * 60 * 1000
    );
    return () => clearInterval(handle);
  }, []);

  const doLogin = async (fireUser: FirebaseUser) => {
    try {
      // prevent multiple logins
      const location = window.location;
      if (location.pathname.startsWith('/login')) return;

      if (!fireUser) {
        throw 'No user found';
      }

      const token = await fireUser.getIdToken();
      if (!token) throw 'No token found';

      if (isDoingLogin) return;

      isDoingLogin = true;

      const userRes = await axios.post('/api/auth/login', null, {
        headers: { Authorization: `Bearer ${token}` },
      });

      isDoingLogin = false;

      const userData = userRes.data as User;

      if (user && checkEqual(userData, user)) return;

      setUser(userData);
    } catch (e: any) {
      console.error(e);
    }
  };

  const getSession = async () => {
    try {
      const sessionExp = getCookie('idb-session-exp');

      if (!navigator.cookieEnabled || (document.cookie && sessionExp)) return;

      const res = await axios.get('/api/auth/getSession');
      return res.data;
    } catch (e) {
      console.error('getSession error', e);
      return null;
    }
  };

  const signout = async () => {
    await axios.post('/api/auth/logout');
    await resetUser();
    location.reload();
  };

  const updatePref = async (
    key: keyof UserPreferences,
    value: UserPreferences[keyof UserPreferences]
  ) => {
    const newPref = { ...(userPref ?? undefined), [key]: value };
    setUserPref(newPref);
  };

  const resetUser = async () => {
    const auth = (await getAuth()).auth;
    await auth.signOut();
    setUser(null);
    setUserToken(null);
    setUserPref(null);
  };

  const checkProof = () => {
    const proof = getCookie('itemdb-proof');

    if (navigator.cookieEnabled && document.cookie && !proof) {
      console.error('Site proof cookie is missing, refreshing');
      captureException(new Error('Site proof cookie is missing, refreshing'));
      location.reload();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: user,
        userToken: userToken,
        signout,
        authLoading,
        setUser,
        updatePref,
        userPref,
        resetUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};

const checkEqual = (a: object, b: object) => {
  return JSON.stringify(a) === JSON.stringify(b);
};

axios.interceptors.request.use((config) => {
  if (!config) return config;

  const url = new URL(config.url ?? '', window.location.origin);

  const isTrusted = url.origin === window.location.origin || url.hostname.endsWith('itemdb.com.br');

  if (!isTrusted) {
    return config;
  }

  const proof = getCookie('itemdb-proof');
  if (proof) config.headers['X-itemdb-Proof'] = proof;

  return config;
});
