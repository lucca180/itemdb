import React, { useState, useEffect, useContext, createContext } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { useAtom } from 'jotai';
import { atomWithStorage, createJSONStorage } from 'jotai/utils';
import { User, UserPreferences } from '../types';
import axios from 'axios';

const getAuth = () => import('./firebase/auth');

type AuthContextType = {
  user: User | null;
  userToken: string | null;
  signout: () => void;
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
  authLoading: true,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setUser: () => {},
  updatePref: () => {},
  userPref: null,
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

  // force refresh the token every 10 minutes
  useEffect(() => {
    const handle = setInterval(
      async () => {
        getAuth().then(async (res) => {
          const { auth } = res;
          const user = auth.currentUser;
          if (user) await user.getIdToken(true);
        });
      },
      10 * 60 * 1000
    );
    return () => clearInterval(handle);
  }, []);

  const doLogin = async (fireUser: FirebaseUser) => {
    try {
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

const checkEqual = (a: object, b: object) => {
  return JSON.stringify(a) === JSON.stringify(b);
};
