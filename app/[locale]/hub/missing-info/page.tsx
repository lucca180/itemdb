import type { Metadata } from 'next';
import { Suspense } from 'react';
import AppServerLayout from '@components/Layout/AppServerLayout';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppPageProps } from '@utils/appPage';
import { routing } from '@utils/locales';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { buildMissingInfoPageProps } from './buildMissingInfoPageProps';
import { MissingInfoPageClient } from './MissingInfoPageClient';

const mainColor = 'rgba(240, 250, 148, 0.40)';

type MissingInfoPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: MissingInfoPageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const labels = await buildMissingInfoPageProps();
  const t = await getTranslations();
  const pageProps = getStaticAppPageProps(locale, {
    title: t('MissingHub.missing-info-hub'),
    description: labels.metaDescription,
    pathname: '/hub/missing-info',
  });

  return {
    ...pageProps.metadata,
    themeColor: '#aeb18a',
  };
}

export default function MissingInfoPage({ params }: MissingInfoPageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton mainColor={mainColor} />}>
      <MissingInfoPageContent params={params} />
    </Suspense>
  );
}

async function MissingInfoPageContent({ params }: MissingInfoPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const labels = await buildMissingInfoPageProps();

  return (
    <AppServerLayout locale={locale} disableNextSeo mainColor={mainColor}>
      <MissingInfoPageClient labels={labels} />
    </AppServerLayout>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
