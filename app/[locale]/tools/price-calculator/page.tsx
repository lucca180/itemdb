import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SetMainColor } from '@components/Layout/SetMainColor';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppMetadata } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { getTranslations } from 'next-intl/server';
import { buildPriceCalculatorPageProps } from './buildPriceCalculatorPageProps';
import { PriceCalculatorPageClient } from './PriceCalculatorPageClient';

const mainColor = '#3697bfc7';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  const metadata = await getStaticAppMetadata({
    title: t('Calculator.pricing-calculator'),
    description: t('Calculator.description'),
    pathname: '/tools/price-calculator',
  });

  return {
    ...metadata,
  };
}

export default function PriceCalculatorPage() {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <PriceCalculatorPageContent />
    </Suspense>
  );
}

async function PriceCalculatorPageContent() {
  const labels = await buildPriceCalculatorPageProps();

  return (
    <>
      <SetMainColor color={mainColor} />
      <PriceCalculatorPageClient labels={labels} />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
