import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Heading, Text, Box } from '@chakra-ui/react';
import { SetMainColor } from '@components/Layout/SetMainColor';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import HeaderCard from '@components/Card/HeaderCard';
import { BreadcrumbsView } from '@components/Breadcrumbs/BreadcrumbsView';
import { getStaticAppMetadata } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { getTranslations } from 'next-intl/server';
import { buildImportPageProps } from '../buildImportPageProps';
import { ImportItemsV2 } from './ImportItemsV2';
import { ImportSessionAlert } from './ImportSessionAlert';

const mainColor = '#65855Bc7';
const ogImage = {
  url: 'https://images.neopets.com/caption/sm_caption_831.gif',
  width: 150,
  height: 150,
};

type ImportV2PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    importToken?: string;
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  const metadata = await getStaticAppMetadata({
    title: t('Lists.importV2-title'),
    description: t('Lists.import-page-description'),
    pathname: '/lists/import/v2',
  });

  return {
    ...metadata,
    robots: { index: false, follow: false },
    openGraph: {
      ...metadata.openGraph,
      images: [ogImage],
    },
  };
}

export default function ImportV2Page({ params, searchParams }: ImportV2PageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <ImportV2PageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ImportV2PageContent({ params, searchParams }: ImportV2PageProps) {
  const { locale } = await params;
  const query = await searchParams;
  const labels = await buildImportPageProps(locale, query.importToken);
  const t = await getTranslations();

  const breadcrumbList = [
    ...labels.breadcrumbList,
    {
      position: 4,
      name: t('Lists.importV2-title'),
      item: '/lists/import/v2',
    },
  ];

  return (
    <>
      <SetMainColor color={mainColor} />
      <HeaderCard
        image={{
          src: 'https://images.neopets.com/caption/sm_caption_831.gif',
          alt: 'Importing Items Thumbnail',
        }}
        color="#65855B"
        breadcrumb={<BreadcrumbsView breadcrumbList={breadcrumbList} locale={locale} useAppDir />}
      >
        <Heading as="h1" size="lg">
          {t('Lists.importV2-title')}
        </Heading>
        <Text as="div" css={{ '& a': { color: '#b8e9a9' } }}>
          {t('Lists.importV2-page-description')}
        </Text>
      </HeaderCard>

      {!labels.importToken && (
        <Box px={{ base: 2, md: 4 }} pb={8}>
          <ImportSessionAlert variant={labels.sessionExpired ? 'expired' : 'need-token'} />
        </Box>
      )}

      {labels.importToken && labels.indexType && (
        <Box px={{ base: 2, md: 4 }} pb={8}>
          <ImportItemsV2
            importToken={labels.importToken}
            itemCount={labels.itemCount}
            recommended_list={labels.recommended_list}
          />
        </Box>
      )}
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
