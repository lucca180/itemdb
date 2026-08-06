import type { Metadata } from 'next';
import { Suspense } from 'react';
import Color from 'color';
import { SetMainColor } from '@components/Layout/SetMainColor';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppPageProps } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getProfileCore } from './loadUserProfile';
import { UserListsPageBody } from './UserListsPage';

type UserListsPageProps = {
  params: Promise<{ locale: string; username: string }>;
};

export async function generateMetadata({ params }: UserListsPageProps): Promise<Metadata> {
  const { locale, username } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return getStaticAppPageProps(locale, {
    title: t('Lists.owner-username-s-lists', { username }),
    pathname: `/lists/${username}`,
    noindex: true,
  }).metadata;
}

export default function UserListsPage({ params }: UserListsPageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <UserListsPageContent params={params} />
    </Suspense>
  );
}

async function UserListsPageContent({ params }: UserListsPageProps) {
  const { locale, username } = await params;
  setRequestLocale(locale);

  const core = await getProfileCore(username);
  const color = Color(core.owner.profileColor || '#4A5568');
  const mainColor = `${color.hex()}b8`;

  return (
    <>
      <SetMainColor color={mainColor} />
      <UserListsPageBody username={username} core={core} />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
