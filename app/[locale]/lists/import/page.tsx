import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Heading, Text } from '@chakra-ui/react';
import AppServerLayout from '@components/Layout/AppServerLayout';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import HeaderCard from '@components/Card/HeaderCard';
import { BreadcrumbsView } from '@components/Breadcrumbs/BreadcrumbsView';
import { getStaticAppPageProps } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { buildImportPageProps } from './buildImportPageProps';
import { ImportLanding } from './landing';
import { ImportItems } from './ImportItems';

const mainColor = '#65855Bc7';
const ogImage = {
  url: 'https://images.neopets.com/caption/sm_caption_831.gif',
  width: 150,
  height: 150,
};

type ImportPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    importToken?: string;
  }>;
};

export async function generateMetadata({ params }: ImportPageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const pageProps = getStaticAppPageProps(locale, {
    title: t('Lists.checklists-and-importing-items'),
    description: t('Lists.import-page-description'),
    pathname: '/lists/import',
  });

  return {
    ...pageProps.metadata,
    openGraph: {
      ...pageProps.metadata.openGraph,
      images: [ogImage],
    },
  };
}

export default function ImportPage({ params, searchParams }: ImportPageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton mainColor={mainColor} />}>
      <ImportPageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ImportPageContent({ params, searchParams }: ImportPageProps) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(locale);
  const labels = await buildImportPageProps(locale, query.importToken);

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
          {labels.description}
        </Text>
      </HeaderCard>
      {!labels.items && <ImportLanding />}
      {labels.items && labels.indexType && (
        <ImportItems
          items={labels.items}
          indexType={labels.indexType}
          recommended_list={labels.recommended_list}
        />
      )}
    </AppServerLayout>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
