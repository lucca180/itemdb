import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import Layout from '../../components/Layout';
import { PrivacyPageClient } from '../_components/PrivacyPageClient';

type Locale = 'en' | 'pt';

const description =
  'itemdb collects some personal data during its use. Here we will detail more about how we collect, process, and use your data.';

export async function generateMetadata(): Promise<Metadata> {
  const locale = normalizeLocale(await getLocale());

  return {
    title: 'Privacy Policy',
    description,
    alternates: {
      canonical: getCanonical(locale),
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function PrivacyPage() {
  const locale = normalizeLocale(await getLocale());

  return (
    <Layout
      disableNextSeo
      SEO={{
        title: 'Privacy Policy',
        description,
        canonical: getCanonical(locale),
        noindex: true,
      }}
      mainColor="#7AB92Ac7"
    >
      <PrivacyPageClient />
    </Layout>
  );
}

function normalizeLocale(locale: string): Locale {
  return locale === 'pt' ? 'pt' : 'en';
}

function getCanonical(locale: Locale) {
  return `https://itemdb.com.br${locale === 'pt' ? '/pt' : ''}/privacy`;
}
