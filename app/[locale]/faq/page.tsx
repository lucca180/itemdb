import type { Metadata } from 'next';
import { Suspense } from 'react';
import AppServerLayout from '@components/Layout/AppServerLayout';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppPageProps } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { buildFaqPageProps } from './buildFaqPageProps';
import { FaqPageContent } from './FaqPageContent';

const mainColor = '#4bbde0c7';

type FaqPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: FaqPageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  return getStaticAppPageProps(locale, {
    title: t('FAQ.frequent-asked-questions'),
    pathname: '/faq',
  }).metadata;
}

export default function FaqPage({ params }: FaqPageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton mainColor={mainColor} />}>
      <FaqPageContentWrapper params={params} />
    </Suspense>
  );
}

async function FaqPageContentWrapper({ params }: FaqPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const content = await buildFaqPageProps();

  return (
    <AppServerLayout locale={locale} disableNextSeo mainColor={mainColor}>
      <FaqPageContent content={content} />
    </AppServerLayout>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
