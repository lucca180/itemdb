import type { Metadata } from 'next';
import AppServerLayout from '@components/Layout/AppServerLayout';
import { getStaticAppPageProps } from '@utils/appPage';
import { PrivacyPageClient } from './PrivacyPageClient';
import { setRequestLocale } from 'next-intl/server';
import { use } from 'react';
import { routing } from '@utils/locales';

export const dynamic = 'force-static';

const description =
  'itemdb collects some personal data during its use. Here we will detail more about how we collect, process, and use your data.';
const pageConfig = {
  title: 'Privacy Policy',
  description,
  pathname: '/privacy',
  noindex: true,
  nofollow: true,
} as const;

type PrivacyPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PrivacyPageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  return getStaticAppPageProps(locale, pageConfig).metadata;
}

export default function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = use(params);
  setRequestLocale(locale);
  return (
    <AppServerLayout locale={locale} disableNextSeo mainColor="#7AB92Ac7">
      <PrivacyPageClient />
    </AppServerLayout>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
