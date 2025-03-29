import React, { useState, useEffect, useContext, createContext } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { User, UserPreferences } from '../types';
import axios from 'axios';

const getAuth = () => import('./firebase/auth');

type AuthContextType = {
  user: User | null;
  userToken: string | null;
  signout: () => void;
  getIdToken: () => string | null;
  authLoading: boolean;
  setUser: (user: User) => void;
  updatePref: (key: keyof UserPreferences, value: UserPreferences[keyof UserPreferences]) => void;
  userPref: UserPreferences | null;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  userToken: null,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  signout: () => {},
  getIdToken: () => null,
  authLoading: true,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setUser: () => {},
  updatePref: () => {},
  userPref: null,
});

const storageSession =
  typeof window !== 'undefined'
    ? {
        getItem: (key: string) => JSON.parse(sessionStorage.getItem(key) ?? 'null'),
        setItem: (key: string, value: any) => sessionStorage.setItem(key, JSON.stringify(value)),
        removeItem: (key: string) => sessionStorage.removeItem(key),
        subscribe: (key: string, callback: (value: any) => void, initialValue: any) => {
          const listener = (e: StorageEvent) => {
            if (e.key === key) {
              callback(e.newValue ? JSON.parse(e.newValue) : initialValue);
            }
          };
          window.addEventListener('storage', listener);
          return () => window.removeEventListener('storage', listener);
        },
      }
    : undefined;

const storageLocal =
  typeof window !== 'undefined'
    ? {
        getItem: (key: string) => JSON.parse(localStorage.getItem(key) ?? 'null'),
        setItem: (key: string, value: any) => localStorage.setItem(key, JSON.stringify(value)),
        removeItem: (key: string) => localStorage.removeItem(key),
        subscribe: (key: string, callback: (value: any) => void, initialValue: any) => {
          const listener = (e: StorageEvent) => {
            if (e.key === key) {
              callback(e.newValue ? JSON.parse(e.newValue) : initialValue);
            }
          };
          window.addEventListener('storage', listener);
          return () => window.removeEventListener('storage', listener);
        },
      }
    : undefined;

export const UserState = atomWithStorage<User | null>('UserState', null, storageSession as any);

export const UserPrefs = atomWithStorage<UserPreferences | null>(
  'UserPrefs',
  null,
  storageLocal as any
);

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
          return;
        }

        if (newUser && newUser.uid !== user?.id) {
          await doLogin(newUser);
        }

        const token = await newUser.getIdToken();
        setUserToken(token);
        setAuthLoading(false);
      });
    });

    return () => {
      unsubs.then((unsubs) => unsubs());
    };
  }, []);

  // for backwards compatibility
  const getIdToken = () => {
    return userToken;
  };

  // force refresh the token every 10 minutes
  useEffect(() => {
    const handle = setInterval(async () => {
      getAuth().then(async (res) => {
        const { auth } = res;
        const user = auth.currentUser;
        if (user) await user.getIdToken(true);
      });
    }, 10 * 60 * 1000);
    return () => clearInterval(handle);
  }, []);

  const doLogin = async (user: FirebaseUser) => {
    try {
      if (!user) {
        throw 'No user found';
      }

      const token = await user.getIdToken();
      if (!token) throw 'No token found';

      const userRes = await axios.post('/api/auth/login', null, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userData = userRes.data as User;
      userData.isAdmin = userData.role === 'ADMIN';

      setUser(userData);
    } catch (e: any) {
      console.error(e);
    }
  };

  const signout = async () => {
    const auth = (await getAuth()).auth;
    auth.signOut();
    await axios.get('/api/auth/logout');
    setUser(null);
    location.reload();
  };

  const updatePref = async (
    key: keyof UserPreferences,
    value: UserPreferences[keyof UserPreferences]
  ) => {
    const newPref = { ...(userPref ?? undefined), [key]: value };
    setUserPref(newPref);
  };

  return (
    <AuthContext.Provider
      value={{
        user: user,
        userToken: userToken,
        signout,
        getIdToken,
        authLoading,
        setUser,
        updatePref,
        userPref,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};

const LATEST_SCRIPT_VERSION = 191;
export const showScriptCTA = (): false | 'notFound' | 'outdated' => {
  if (!window) return false;

  const hasScript = !!(window.itemdb_restock || window.itemdb_script || window.itemdb_sdbPricer);

  if (!hasScript) return false;

  if (hasScript && !window.itemdb_script) {
    return 'notFound';
  }

  if (window.itemdb_script && window.itemdb_script.versionCode < LATEST_SCRIPT_VERSION) {
    return 'outdated';
  }

  return false;
};
