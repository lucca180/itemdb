import type { Metadata } from 'next';
import { Suspense } from 'react';
import AppServerLayout from '@components/Layout/AppServerLayout';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppPageProps } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import { OfficialListsPageBody } from './OfficialListsPage';

const mainColor = '#4962ecc7';
const ogImage = {
  url: 'https://images.neopets.com/games/tradingcards/premium/0911.gif',
  width: 150,
  height: 150,
};

type OfficialListsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cat?: string }>;
};

export async function generateMetadata({ params }: OfficialListsPageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const pageProps = getStaticAppPageProps(locale, {
    title: t('General.official-lists'),
    description: t('Lists.officialList-description'),
    pathname: '/lists/official',
  });

  return {
    ...pageProps.metadata,
    openGraph: {
      ...pageProps.metadata.openGraph,
      images: [ogImage],
    },
  };
}

export default function OfficialListsPage({ params, searchParams }: OfficialListsPageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton mainColor={mainColor} />}>
      <OfficialListsPageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function OfficialListsPageContent({ params, searchParams }: OfficialListsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { cat } = await searchParams;
  const { user } = await getServerCurrentUser();
  const canEdit = user?.isAdmin ?? false;

  return (
    <AppServerLayout locale={locale} disableNextSeo mainColor={mainColor}>
      <OfficialListsPageBody locale={locale} initialCat={cat} canEdit={canEdit} />
    </AppServerLayout>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
