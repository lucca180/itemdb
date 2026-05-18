import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { atom, useAtom } from 'jotai';
import { atomWithStorage, useHydrateAtoms } from 'jotai/utils';
import { User, UserPreferences } from '@types';
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

const UserState = atom<User | null | undefined>(null);
export const UserPrefs = atomWithStorage<UserPreferences | null>('UserPrefs', null);

type AuthProviderProps = {
  children: ReactNode;
  initialUser?: User | null;
};

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  useHydrateAtoms([[UserState, initialUser]]);
  const [user, setUser] = useAtom(UserState);
  const [userPref, setUserPref] = useAtom(UserPrefs);
  const [authLoading, setAuthLoading] = useState<boolean>(typeof initialUser === 'undefined');

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
    let isMounted = true;

    const syncFromClientApi = async () => {
      try {
        const res = await axios.get('/api/auth/me');
        const userData = res.data as User;

        if (!isMounted || (user && checkEqual(userData, user))) return;
        setUser(userData);
      } catch {
        if (isMounted) setUser(null);
      } finally {
        if (!isMounted) return;
        setAuthLoading(false);
        void getSession();
      }
    };

    if (typeof initialUser === 'undefined') {
      void syncFromClientApi();
    } else setAuthLoading(false);

    return () => {
      isMounted = false;
    };
  }, [initialUser]);

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
        user: user ?? null,
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
