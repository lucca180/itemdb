import React, { useState, useEffect, useContext, createContext } from 'react';
import { setCookie, deleteCookie } from 'cookies-next';
import type { User as FirebaseUser } from 'firebase/auth';
import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { User, UserList } from '../types';
import axios from 'axios';

const getAuth = () => import('./firebase/auth');

type AuthContextType = {
  user: User | null;
  userToken: string | null;
  signout: () => void;
  getIdToken: () => string | null;
  authLoading: boolean;
  setUser: (user: User) => void;
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
});

const storage =
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

export const UserState = atomWithStorage<User | null>('UserState', null, storage as any);
export const UserLists = atomWithStorage<UserList[] | null>('UserLists', null, storage as any);

export function AuthProvider({ children }: any) {
  const [, setLists] = useAtom(UserLists);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [user, setUser] = useAtom(UserState);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubs = getAuth().then((res) => {
      const { auth } = res;

      return auth.onIdTokenChanged(async (newUser) => {
        if (!newUser) {
          deleteCookie('userToken');
          setUserToken(null);
          setAuthLoading(false);
          return;
        }

        if (newUser && newUser.uid !== user?.id) {
          await doLogin(newUser);
        }

        const token = await newUser.getIdToken();
        deleteCookie('userToken');
        setCookie('userToken', token, { secure: true });
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

      setCookie('userToken', token, { secure: true });
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
    setLists(null);
    location.reload();
  };

  return (
    <AuthContext.Provider
      value={{ user: user, userToken: userToken, signout, getIdToken, authLoading, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
