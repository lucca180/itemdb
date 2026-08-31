import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Heading, Text, Link, Box } from '@chakra-ui/react';
import { SetMainColor } from '@components/Layout/SetMainColor';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import HeaderCard from '@components/Card/HeaderCard';
import { BreadcrumbsView } from '@components/Breadcrumbs/BreadcrumbsView';
import { getStaticAppMetadata } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { getTranslations } from 'next-intl/server';
import MainLink from '@components/Utils/MainLink';
import { buildImportPageProps } from '../buildImportPageProps';
import { ImportItemsV2 } from './ImportItemsV2';

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
    title: `${t('Lists.checklists-and-importing-items')} (v2)`,
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
      name: 'v2',
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
          {labels.heading} (v2)
        </Heading>
        <Text as="div" css={{ '& a': { color: '#b8e9a9' } }}>
          {t('Lists.importV2-page-description')}
        </Text>
      </HeaderCard>

      {!labels.importToken && (
        <Box maxW="720px" px={4} py={6}>
          <Text mb={3}>
            {labels.sessionExpired
              ? t('Lists.import-error-expired')
              : t('Lists.importV2-need-token')}
          </Text>
          <Link asChild>
            <MainLink href="/lists/import" prefetch={false}>
              {t('Lists.importV2-back-to-import')}
            </MainLink>
          </Link>
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
