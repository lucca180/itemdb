import type { Metadata } from 'next';
import { Suspense } from 'react';
import AppServerLayout from '@components/Layout/AppServerLayout';
import { getStaticAppPageProps } from '@utils/appPage';
import { TermsPageClient } from './TermsPageClient';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@utils/locales';

const description = 'This page outlines the terms of use for itemdb, its features, and API.';
const pageConfig = {
  title: 'Terms of Use',
  description,
  pathname: '/terms',
  noindex: true,
  nofollow: true,
} as const;

type TermsPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: TermsPageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  return getStaticAppPageProps(locale, pageConfig).metadata;
}

export default function TermsPage({ params }: TermsPageProps) {
  return (
    <Suspense fallback={null}>
      <TermsPageContent params={params} />
    </Suspense>
  );
}

async function TermsPageContent({ params }: TermsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AppServerLayout locale={locale} disableNextSeo mainColor="#a5aa9fc7">
      <TermsPageClient />
    </AppServerLayout>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
