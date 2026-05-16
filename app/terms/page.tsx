import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import Layout from '@components/Layout';
import { getStaticAppPageProps } from '@utils/appPage';
import { TermsPageClient } from './TermsPageClient';

const description = 'This page outlines the terms of use for itemdb, its features, and API.';
const pageConfig = {
  title: 'Terms of Use',
  description,
  pathname: '/terms',
  noindex: true,
  nofollow: true,
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();

  return getStaticAppPageProps(locale, pageConfig).metadata;
}

export default async function TermsPage() {
  const locale = await getLocale();
  const pageProps = getStaticAppPageProps(locale, pageConfig);

  return (
    <Layout disableNextSeo SEO={pageProps.seo} mainColor="#a5aa9fc7">
      <TermsPageClient />
    </Layout>
  );
}
