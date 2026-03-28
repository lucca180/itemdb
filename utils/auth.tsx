import React, { useState, useEffect, useContext, createContext } from 'react';
import { useAtom } from 'jotai';
import { atomWithStorage, createJSONStorage } from 'jotai/utils';
import { User, UserPreferences } from '../types';
import axios from 'axios';
import { getCookie } from 'cookies-next/client';

type AuthContextType = {
  user: User | null;
  signout: () => Promise<void>;
  authLoading: boolean;
  setUser: (user: User) => void;
  updatePref: (key: keyof UserPreferences, value: UserPreferences[keyof UserPreferences]) => void;
  userPref: UserPreferences | null;
  resetUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,

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

export function AuthProvider({ children }: any) {
  const [user, setUser] = useAtom(UserState);
  const [userPref, setUserPref] = useAtom(UserPrefs);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

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

  useEffect(() => {
    axios
      .get('/api/auth/me')
      .then((res) => {
        const userData = res.data as User;
        if (user && checkEqual(userData, user)) return;
        setUser(userData);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setAuthLoading(false);
        getSession();
      });
  }, []);

  const updatePref = async (
    key: keyof UserPreferences,
    value: UserPreferences[keyof UserPreferences]
  ) => {
    const newPref = { ...(userPref ?? undefined), [key]: value };
    setUserPref(newPref);
  };

  const resetUser = async () => {
    setUser(null);
    setUserPref(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user: user,
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
