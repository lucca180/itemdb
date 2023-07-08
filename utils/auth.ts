import React, { useEffect } from 'react';
import { atom, useRecoilState } from 'recoil';
import { recoilPersist } from 'recoil-persist';
import axios from 'axios';
import { getAuth, User as FirebaseUser } from 'firebase/auth';
import { useRouter } from 'next/router';
import { User, UserList } from '../types';
import { getCookie, setCookie } from 'cookies-next';

const { persistAtom } = recoilPersist({
  storage: typeof window !== 'undefined' ? sessionStorage : undefined,
});

export const UserState = atom<User | null>({
  key: 'UserState',
  default: null,
  effects_UNSTABLE: [persistAtom],
});

export const UserLists = atom<UserList[] | null>({
  key: 'UserLists',
  default: null,
});

type UseAuthProps = {
  redirect?: string;
};

let isRequesting = false;

export const useAuth = (props?: UseAuthProps) => {
  const redirect = props?.redirect;
  const [isLoading, setIsLoading] = React.useState(true);
  const [user, setUser] = useRecoilState(UserState);
  const auth = getAuth();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const unsub = auth.onAuthStateChanged(async (fireUser) => {
      if (!fireUser) {
        setUser(null);

        if (redirect) router.push(redirect);

        setIsLoading(false);
        return;
      }

      if (user && user.id === fireUser.uid) {
        checkCookie();
        setIsLoading(false);
        return;
      }
      if (!isRequesting) {
        isRequesting = true;
        doLogin(fireUser);
      }
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

      setCookie('userToken', token, { secure: true });
      const userRes = await axios.post('/api/auth/login', null, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userData = userRes.data as User;
      userData.isAdmin = userData.role === 'ADMIN';

      setUser(userData);
      setIsLoading(false);
      isRequesting = false;
    } catch (e: any) {
      console.error(e);
    }
  };

  const checkCookie = async () => {
    const cookie = getCookie('userToken');
    if (cookie) return;
    await getIdToken();
  };

  const getIdToken = async () => {
    try {
      if (!auth.currentUser) return null;

      const token = await auth.currentUser.getIdToken();

      if (!token) return null;
      setCookie('userToken', token, { secure: true });

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
