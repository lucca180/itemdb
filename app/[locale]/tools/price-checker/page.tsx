import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { PriceCheckerPageClient } from '@app/[locale]/tools/price-checker/PriceCheckerPageClient';
import { getStaticAppMetadata } from '@app/utils/appPage';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { SetMainColor } from '@components/Layout/SetMainColor';
import { routing } from '@utils/locales';

const mainColor = '#f0a84ec7';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('PriceChecker');

  return await getStaticAppMetadata({
    title: t('title'),
    description: t('description'),
    pathname: '/tools/price-checker',
  });
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
      <SetMainColor color={mainColor} />
      <PriceCheckerPageClient />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
