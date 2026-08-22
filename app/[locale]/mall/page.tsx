import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Box, Flex, Grid, Skeleton } from '@chakra-ui/react';
import { SetMainColor } from '@components/Layout/SetMainColor';
import { getStaticAppMetadata } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { getTranslations } from 'next-intl/server';
import { CoverStorySection } from './sections/CoverStorySection';
import { MallHubSectionSlots } from './MallHubSectionSlots';
import { MallHubShell, MallHubShellSkeleton } from './MallHubShell';
import { MALL_HUB_COLOR_WASH, MALL_HUB_OG_IMAGE, MALL_HUB_PATH } from './mallHubTheme';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  const metadata = await getStaticAppMetadata({
    title: t('NcMall.hub-seo-title'),
    description: t('NcMall.hub-seo-description'),
    pathname: MALL_HUB_PATH,
  });

  return {
    ...metadata,
    twitter: { ...metadata.twitter, card: 'summary_large_image' },
    openGraph: {
      ...metadata.openGraph,
      images: [{ ...MALL_HUB_OG_IMAGE, alt: t('NcMall.hub-h1') }],
    },
  };
}

export default function NcMallHubPage({ params }: PageProps) {
  return (
    <>
      <SetMainColor color={MALL_HUB_COLOR_WASH} />
      <Box
        position="absolute"
        h={{ base: '280px', md: '420px' }}
        left="0"
        width="100%"
        bgGradient="linear-gradient(to top,rgba(0,0,0,0) 0,rgba(205,193,255,.55) 70%)"
        zIndex={-1}
      />
      <Box w="100%" maxW="1240px" mx="auto" minW={0} overflowX="clip">
        <Suspense fallback={<MallHubShellSkeleton />}>
          <MallHubPageContent params={params} />
        </Suspense>
        <Flex
          direction="column"
          gap={{ base: 6, md: 8 }}
          w="100%"
          minW={0}
          px={{ base: 2, md: 4 }}
          pb={{ base: 12, md: 16 }}
          mt={{ base: 8, md: 10 }}
        >
          <Grid
            templateColumns={{ base: '1fr', lg: 'minmax(0, 2.1fr) minmax(0, 1fr)' }}
            gap={{ base: 4, lg: 6 }}
            alignItems="start"
            w="100%"
            minW={0}
          >
            <CoverStorySection />
            <Skeleton
              w="100%"
              minW={0}
              h={{ base: '220px', md: '360px' }}
              borderRadius="xl"
              bg="gray.700"
              aria-hidden="true"
            />
          </Grid>
          <MallHubSectionSlots />
        </Flex>
      </Box>
    </>
  );
}

async function MallHubPageContent({ params }: PageProps) {
  const { locale } = await params;
  return <MallHubShell locale={locale} />;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
