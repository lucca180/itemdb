import React, { useEffect } from 'react';
import { atom, useRecoilState } from 'recoil';
import { recoilPersist } from 'recoil-persist';
import axios from 'axios';
import { getAuth, User as FirebaseUser } from 'firebase/auth';
import { useRouter } from 'next/router';
import { User } from '../types';

const { persistAtom } = recoilPersist({
  storage: typeof window !== 'undefined' ? sessionStorage : undefined,
});

export const UserState = atom<User | null>({
  key: 'UserState',
  default: null,
  effects_UNSTABLE: [persistAtom],
});

type UseAuthProps = {
  redirect?: string;
};

export const useAuth = (props?: UseAuthProps) => {
  const redirect = props?.redirect;
  const [isLoading, setIsLoading] = React.useState(true);
  const [user, setUser] = useRecoilState(UserState);
  const auth = getAuth();
  const router = useRouter();

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

      doLogin(fireUser);
    });

    return () => unsub();
  }, []);

  const doLogin = async (user: FirebaseUser) => {
    try {
      if (!user) {
        setIsLoading(false);
        if (redirect) router.push(redirect);
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
      setIsLoading(false);
    } catch (e: any) {
      console.error(e);
    }
  };

  const getIdToken = async () => {
    try {
      if (!auth.currentUser) return null;

      const token = await auth.currentUser.getIdToken();
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
