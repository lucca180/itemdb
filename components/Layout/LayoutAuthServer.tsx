import { cookies } from 'next/headers';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import { LayoutAuth } from '@components/Layout/AuthButton';

export async function LayoutAuthServer() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  const { user } = sessionCookie ? await getServerCurrentUser() : { user: null };

  return <LayoutAuth initialUser={user} />;
}
