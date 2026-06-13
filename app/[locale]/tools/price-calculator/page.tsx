import type { Metadata } from 'next';
import { Suspense } from 'react';
import AppServerLayout from '@components/Layout/AppServerLayout';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppPageProps } from '@utils/appPage';
import { routing } from '@utils/locales';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { buildPriceCalculatorPageProps } from './buildPriceCalculatorPageProps';
import { PriceCalculatorPageClient } from './PriceCalculatorPageClient';

const mainColor = '#3697bfc7';

type PriceCalculatorPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PriceCalculatorPageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const pageProps = getStaticAppPageProps(locale, {
    title: t('Calculator.pricing-calculator'),
    description: t('Calculator.description'),
    pathname: '/tools/price-calculator',
  });

  return {
    ...pageProps.metadata,
    themeColor: '#3697bf',
  };
}

export default function PriceCalculatorPage({ params }: PriceCalculatorPageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton mainColor={mainColor} />}>
      <PriceCalculatorPageContent params={params} />
    </Suspense>
  );
}

async function PriceCalculatorPageContent({ params }: PriceCalculatorPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const labels = await buildPriceCalculatorPageProps();

  return (
    <AppServerLayout locale={locale} disableNextSeo mainColor={mainColor}>
      <PriceCalculatorPageClient labels={labels} />
    </AppServerLayout>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
