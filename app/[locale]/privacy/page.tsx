import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import AppServerLayout from '@components/Layout/AppServerLayout';
import { getStaticAppPageProps } from '@utils/appPage';
import { PrivacyPageClient } from './PrivacyPageClient';

const description =
  'itemdb collects some personal data during its use. Here we will detail more about how we collect, process, and use your data.';
const pageConfig = {
  title: 'Privacy Policy',
  description,
  pathname: '/privacy',
  noindex: true,
  nofollow: true,
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();

  return getStaticAppPageProps(locale, pageConfig).metadata;
}

export default async function PrivacyPage() {
  return (
    <AppServerLayout disableNextSeo mainColor="#7AB92Ac7">
      <PrivacyPageClient />
    </AppServerLayout>
  );
}
