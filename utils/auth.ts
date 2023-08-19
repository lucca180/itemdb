import React, { useEffect } from 'react';

import axios from 'axios';
import { getAuth, User as FirebaseUser } from 'firebase/auth';
import { useRouter } from 'next/router';
import { User, UserList } from '../types';
import { setCookie, deleteCookie } from 'cookies-next';
import { useMutex } from 'react-context-mutex';
import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

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

type UseAuthProps = {
  redirect?: string;
};

export const useAuth = (props?: UseAuthProps) => {
  const redirect = props?.redirect;
  const [isLoading, setIsLoading] = React.useState(true);
  const [user, setUser] = useAtom(UserState);
  const [, setLists] = useAtom(UserLists);
  const auth = getAuth();
  const router = useRouter();
  const MutexRunner = useMutex();
  const mutex = new MutexRunner('authMutex');

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (fireUser) => {
      if (!fireUser) {
        setUser(null);

        if (redirect) router.push(redirect);

        setIsLoading(false);
        return;
      }

      if (user && user.id === fireUser.uid) {
        setIsLoading(false);
        return;
      }

      mutex.run(() => doLogin(fireUser));
    });

    const unsubToken = auth.onIdTokenChanged(async (fireUser) => {
      if (fireUser) {
        const token = await fireUser.getIdToken();

        if (!token) {
          deleteCookie('userToken');
          return;
        }

        setCookie('userToken', token, { secure: true });
      }
    });

    return () => {
      unsub();
      unsubToken();
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    setIsLoading(false);
  }, [user]);

  const doLogin = async (user: FirebaseUser) => {
    mutex.lock();
    try {
      if (!user) {
        setIsLoading(false);
        if (redirect) router.push(redirect);
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
      setIsLoading(false);
    } catch (e: any) {
      console.error(e);
    }
    mutex.unlock();
  };

  const getIdToken = async (forceRefresh = false) => {
    try {
      if (!auth.currentUser) return null;

      const token = await auth.currentUser.getIdToken(forceRefresh);

      if (!token) return null;

      return token;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const signout = () => {
    auth.signOut();
    setUser(null);
    setLists(null);
    location.reload();
  };

  return {
    authLoading: isLoading,
    user,
    signout,
    getIdToken,
    setUser,
    firebaseUser: auth.currentUser,
  };
};
