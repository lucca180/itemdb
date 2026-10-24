import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { SetMainColor } from '@components/Layout/SetMainColor';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppMetadata } from '@app/utils/appPage';
import { routing, withLocalePrefix, type AppLocale } from '@utils/locales';
import { getTranslations } from 'next-intl/server';
import { PRICE_CHECKER_ACCENT } from '@app/[locale]/tools/price-checker/priceCheckerTheme';
import { ImportPageClient } from './ImportPageClient';

const ogImage = {
  url: 'https://images.neopets.com/caption/sm_caption_831.gif',
  width: 150,
  height: 150,
};

type ImportPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    importToken?: string;
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  const metadata = await getStaticAppMetadata({
    title: t('Lists.checklists-and-importing-items'),
    description: t('Lists.import-page-description'),
    pathname: '/lists/import',
  });

  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      images: [ogImage],
    },
  };
}

export default function ImportPage({ params, searchParams }: ImportPageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <ImportPageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ImportPageContent({ params, searchParams }: ImportPageProps) {
  const { locale } = await params;
  const { importToken } = await searchParams;

  // Import sessions are handled by the v2 page.
  if (importToken) {
    redirect(
      withLocalePrefix(
        `/lists/import/v2?importToken=${encodeURIComponent(importToken)}`,
        locale as AppLocale
      )
    );
  }

  return (
    <>
      <SetMainColor color={`${PRICE_CHECKER_ACCENT}c7`} />
      <ImportPageClient />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
