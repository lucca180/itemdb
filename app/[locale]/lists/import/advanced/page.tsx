import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Heading, Text, Separator } from '@chakra-ui/react';
import AppServerLayout from '@components/Layout/AppServerLayout';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import HeaderCard from '@components/Card/HeaderCard';
import { BreadcrumbsView } from '@components/Breadcrumbs/BreadcrumbsView';
import { getStaticAppPageProps } from '@utils/appPage';
import { routing } from '@utils/locales';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { buildAdvancedImportPageProps } from './buildAdvancedImportPageProps';
import { AdvancedImportForm } from './AdvancedImportPageClient';

const mainColor = '#65855Bc7';
const ogImage = {
  url: 'https://images.neopets.com/caption/sm_caption_831.gif',
  width: 150,
  height: 150,
};

type AdvancedImportPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: AdvancedImportPageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const pageProps = getStaticAppPageProps(locale, {
    title: t('Lists.checklists-and-importing-items'),
    description: t('Lists.import-page-description'),
    pathname: '/lists/import/advanced',
  });

  return {
    ...pageProps.metadata,
    openGraph: {
      images: [ogImage],
    },
  };
}

export default function AdvancedImportPage({ params }: AdvancedImportPageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton mainColor={mainColor} />}>
      <AdvancedImportPageContent params={params} />
    </Suspense>
  );
}

async function AdvancedImportPageContent({ params }: AdvancedImportPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const labels = await buildAdvancedImportPageProps(locale);

  return (
    <AppServerLayout locale={locale} disableNextSeo mainColor={mainColor}>
      <HeaderCard
        image={{
          src: 'https://images.neopets.com/caption/sm_caption_831.gif',
          alt: 'Importing Items Thumbnail',
        }}
        color="#65855B"
        breadcrumb={
          <BreadcrumbsView breadcrumbList={labels.breadcrumbList} locale={locale} useAppDir />
        }
      >
        <Heading as="h1" size="lg">
          {labels.heading}
        </Heading>
        <Text as="div" css={{ '& a': { color: '#b8e9a9' } }}>
          {labels.importDescription}
        </Text>
      </HeaderCard>
      <Separator mb={3} />
      <Text fontSize={'md'} css={{ b: { color: '#b8e9a9' } }}>
        {labels.importAdv1}
        <br />
        <Text as="span" fontSize={'sm'} color="gray.400">
          {labels.importAdv2}
        </Text>
      </Text>
      <AdvancedImportForm
        locale={labels.locale}
        pastePlaceholder={labels.pastePlaceholder}
        importButton={labels.importButton}
      />
    </AppServerLayout>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
