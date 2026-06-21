import 'server-only';

import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import { getLocalizedLoginRedirect, withLocalePrefix, type AppLocale } from '@utils/locales';

export async function buildFeedbackProtectedPageProps(locale: string, pathname: string) {
  const { user } = await getServerCurrentUser();
  const redirectPath = withLocalePrefix(pathname, locale as AppLocale);

  if (!user) {
    redirect(getLocalizedLoginRedirect(locale as AppLocale, redirectPath));
  }

  if (user.banned) {
    notFound();
  }

  const cookieStore = await cookies();
  const shouldShowReminder = cookieStore.get('bbpb_new_policy_reminder')?.value !== 'true';

  return { shouldShowReminder };
}
