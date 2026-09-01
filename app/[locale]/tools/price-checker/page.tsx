import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { getStaticAppMetadata } from '@app/utils/appPage';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { SetMainColor } from '@components/Layout/SetMainColor';
import { routing } from '@utils/locales';
import { PriceCheckerPageClient } from './PriceCheckerPageClient';
import { PRICE_CHECKER_ACCENT } from './priceCheckerTheme';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('PriceChecker');
  const title = t('seo-title');
  const metadata = await getStaticAppMetadata({
    title,
    description: t('seo-description'),
    pathname: '/tools/price-checker',
  });

  return {
    ...metadata,
    title: { absolute: title },
  };
}

export default function PriceCheckerPage() {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <PriceCheckerPageContent />
    </Suspense>
  );
}

async function PriceCheckerPageContent() {
  return (
    <>
      <SetMainColor color={`${PRICE_CHECKER_ACCENT}c7`} />
      <PriceCheckerPageClient />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
