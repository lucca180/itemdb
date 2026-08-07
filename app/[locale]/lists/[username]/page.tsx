import type { Metadata } from 'next';
import { Suspense } from 'react';
import Color from 'color';
import { SetMainColor } from '@components/Layout/SetMainColor';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppMetadata } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { getTranslations } from 'next-intl/server';
import { getProfileCore } from './loadUserProfile';
import { UserListsPageBody } from './UserListsPage';

type UserListsPageProps = {
  params: Promise<{ locale: string; username: string }>;
};

export async function generateMetadata({ params }: UserListsPageProps): Promise<Metadata> {
  const { username } = await params;
  const t = await getTranslations();

  return await getStaticAppMetadata({
    title: t('Lists.owner-username-s-lists', { username }),
    pathname: `/lists/${username}`,
    noindex: true,
  });
}

export default function UserListsPage({ params }: UserListsPageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <UserListsPageContent params={params} />
    </Suspense>
  );
}

async function UserListsPageContent({ params }: UserListsPageProps) {
  const { username } = await params;

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
