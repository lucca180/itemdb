import { cookies, headers } from 'next/headers';
import { after } from 'next/server';
import { isToday } from 'date-fns';
import requestIp from 'request-ip';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import { LayoutAuth } from '@components/Layout/AuthButton';
import prisma from '@utils/prisma';

export async function LayoutAuthServer() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  const { user } = sessionCookie ? await getServerCurrentUser() : { user: null };

  if (user) {
    // Request APIs can't be read inside `after` in Server Components, so grab headers first.
    const headerStore = await headers();
    const reqLike = { headers: Object.fromEntries(headerStore.entries()) };
    const userId = user.id;
    const lastLogin = user.lastLogin;

    // `isToday` reads the clock, so it runs after the response (never during prerender).
    after(() => {
      if (isToday(new Date(lastLogin))) return;

      const ip =
        requestIp.getClientIp(reqLike as Parameters<typeof requestIp.getClientIp>[0]) || '';

      prisma.user
        .update({
          where: { id: userId },
          data: {
            last_login: new Date(),
            last_ip: ip,
          },
        })
        .then(() => {})
        .catch(() => {});
    });
  }

  return <LayoutAuth initialUser={user} />;
}
