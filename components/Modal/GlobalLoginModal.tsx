'use client';

import { useAtom } from 'jotai';
import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { useAuth } from '@utils/auth';
import { loginRequestAtom, parseLoginSource } from '@utils/loginModal';

const LoginModal = dynamic(() => import('@components/Modal/LoginModal'));

/**
 * The app's single LoginModal (mounted by the root providers of both routers).
 * Open it with `useAuth().openLogin(source)` or a `?login=<source>` link.
 */
export function GlobalLoginModal() {
  const [request, setRequest] = useAtom(loginRequestAtom);
  const { user, authLoading } = useAuth();

  // `?login=<source>` lets plain links and server components open the modal; dropped once read
  useEffect(() => {
    if (authLoading) return;

    const url = new URL(window.location.href);
    if (!url.searchParams.has('login')) return;

    const source = parseLoginSource(url.searchParams.get('login'));
    url.searchParams.delete('login');
    window.history.replaceState(window.history.state, '', url.toString());

    if (source && !user) setRequest({ source });
  }, [authLoading]);

  const close = () => {
    const onClose = request?.onClose;
    setRequest(null);
    onClose?.();
  };

  // already logged in (e.g. the App Router SSR user arrived after `?login=` was read)
  useEffect(() => {
    if (request && user) close();
  }, [request, user]);

  if (!request || user) return null;

  return (
    <LoginModal
      isOpen
      onClose={close}
      source={request.source}
      redirectPath={request.redirectPath}
      trigger={request.trigger}
    />
  );
}
