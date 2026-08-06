import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { SetMainColor } from '@components/Layout/SetMainColor';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppPageProps } from '@app/utils/appPage';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import {
  getLocalizedLoginRedirect,
  routing,
  withLocalePrefix,
  type AppLocale,
} from '@utils/locales';
import { setRequestLocale } from 'next-intl/server';
import { CreateItemPageClient } from './CreateItemPageClient';

const mainColor = '#7AB92Ac7';

type CreateItemPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: CreateItemPageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);

  return getStaticAppPageProps(locale, {
    title: 'Create New Item',
    pathname: '/admin/createItem',
    noindex: true,
    nofollow: true,
  }).metadata;
}

export default function CreateItemPage({ params }: CreateItemPageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <CreateItemPageContent params={params} />
    </Suspense>
  );
}

async function CreateItemPageContent({ params }: CreateItemPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { user } = await getServerCurrentUser();
  if (!user?.isAdmin) {
    redirect(
      getLocalizedLoginRedirect(
        locale as AppLocale,
        withLocalePrefix('/admin/createItem', locale as AppLocale)
      )
    );
  }

  return (
    <>
      <SetMainColor color={mainColor} />
      <CreateItemPageClient />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
