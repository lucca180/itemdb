import 'server-only';

import { notFound, redirect } from 'next/navigation';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import { getLocalizedLoginRedirect, withLocalePrefix, type AppLocale } from '@utils/locales';

export async function buildDataCollectingPageProps(locale: string) {
  const { user } = await getServerCurrentUser();
  const redirectPath = withLocalePrefix('/tools/data-collecting', locale as AppLocale);

  if (!user) {
    redirect(getLocalizedLoginRedirect(locale as AppLocale, redirectPath));
  }

  if (user.banned) {
    notFound();
  }

  return {};
}
