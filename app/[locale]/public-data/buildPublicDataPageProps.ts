import 'server-only';

import { notFound, redirect } from 'next/navigation';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import { getLocalizedLoginRedirect, withLocalePrefix, type AppLocale } from '@utils/locales';
import { canAccessPublicData } from './publicDataAccess';

export async function buildPublicDataPageProps(locale: string) {
  const { user } = await getServerCurrentUser();
  const redirectPath = withLocalePrefix('/public-data', locale as AppLocale);
  const access = canAccessPublicData(user);

  if (access === 'unauthenticated') {
    redirect(getLocalizedLoginRedirect(locale as AppLocale, redirectPath));
  }

  if (access === 'banned') {
    notFound();
  }

  return { isNewAccount: access === 'new_account' };
}
