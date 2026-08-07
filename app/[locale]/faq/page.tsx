import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SetMainColor } from '@components/Layout/SetMainColor';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppMetadata } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { getTranslations } from 'next-intl/server';
import { buildFaqPageProps } from './buildFaqPageProps';
import { FaqPageContent } from './FaqPageContent';

const mainColor = '#4bbde0c7';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return await getStaticAppMetadata({
    title: t('FAQ.frequent-asked-questions'),
    pathname: '/faq',
  });
}

export default function FaqPage() {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <FaqPageContentWrapper />
    </Suspense>
  );
}

async function FaqPageContentWrapper() {
  const content = await buildFaqPageProps();

  return (
    <>
      <SetMainColor color={mainColor} />
      <FaqPageContent content={content} />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
