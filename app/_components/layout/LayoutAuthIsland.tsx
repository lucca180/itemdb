'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { User } from '@types';
import { useAuth } from '@utils/auth';
import { AuthButton } from '@components/Layout/AuthButton';

type LayoutAuthIslandProps = {
  initialUser?: User | null;
};

export function LayoutAuthIsland({ initialUser }: LayoutAuthIslandProps) {
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const { user } = useAuth();
  const resolvedUser = user ?? initialUser;

  useEffect(() => {
    if (!resolvedUser) {
      return;
    }

    if (!resolvedUser.username && !['/', '/login'].includes(pathname)) {
      router.push('/login');
    }
  }, [pathname, router, resolvedUser]);

  return <AuthButton initialUser={initialUser} />;
}
