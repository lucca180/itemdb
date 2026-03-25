import React, { useState, useEffect, useContext, createContext } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { useAtom } from 'jotai';
import { atomWithStorage, createJSONStorage } from 'jotai/utils';
import { User, UserPreferences } from '../types';
import axios from 'axios';
import { getCookie } from 'cookies-next/client';

let authModulePromise: Promise<typeof import('./firebase/auth')> | null = null;

const getAuthModule = () => {
  if (!authModulePromise) {
    authModulePromise = import('./firebase/auth');
  }

  return authModulePromise;
};

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
    const unsubs = getAuthModule().then((res) => {
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

  // force refresh the token every 15 minutes
  useEffect(() => {
    const REFRESH_INTERVAL = 15 * 60 * 1000;
    let lastCheckAt = Date.now();

    const runRefresh = async () => {
      if (document.visibilityState !== 'visible') return;

      const { auth } = await getAuthModule();
      const currentUser = auth.currentUser;

      try {
        if (currentUser) await currentUser.getIdToken(true);
      } catch (e) {
      } finally {
        await getSession();
        lastCheckAt = Date.now();
      }
    };

    const handle = setInterval(() => {
      runRefresh();
    }, REFRESH_INTERVAL);

    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;

      const now = Date.now();
      if (now - lastCheckAt >= REFRESH_INTERVAL) {
        runRefresh();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(handle);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
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
      checkProof();

      const sessionExp = getCookie('idb-session-exp');
      if (!navigator.cookieEnabled || (document.cookie && sessionExp)) return;

      const res = await axios.get('/api/v1/users/getSession');
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
    const auth = (await getAuthModule()).auth;
    await auth.signOut();
    setUser(null);
    setUserToken(null);
    setUserPref(null);
  };

  const checkProof = () => {
    const proof = getCookie('itemdb-proof');
    const hasReloaded = sessionStorage.getItem('reloaded-for-proof');

    if (navigator.cookieEnabled && document.cookie && !proof && !hasReloaded) {
      console.warn('Site proof cookie is missing, refreshing');
      sessionStorage.setItem('reloaded-for-proof', 'true');
      location.reload();
    } else if (proof && hasReloaded) {
      sessionStorage.removeItem('reloaded-for-proof');
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
