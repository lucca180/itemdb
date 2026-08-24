import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Box, Text } from '@chakra-ui/react';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { SetMainColor } from '@components/Layout/SetMainColor';
import { getStaticAppMetadata } from '@app/utils/appPage';
import { routing } from '@utils/locales';
import { NC_MALL_HUB_THEME } from '@app/[locale]/mall/_mock/ncMallHubFixtures';
import { EventsRailDemo } from './EventsRailDemo';

const TITLE = 'NC Mall Hub — Events Rail concept';
const DESCRIPTION =
  'Design mockup of the NC Mall hub Events section as a horizontal rail with an ending-soonest aside.';

export async function generateMetadata(): Promise<Metadata> {
  return getStaticAppMetadata({
    title: TITLE,
    description: DESCRIPTION,
    pathname: '/mall/concepts/events-rail',
    noindex: true,
    nofollow: true,
  });
}

export default function EventsRailPage() {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <SetMainColor color={NC_MALL_HUB_THEME.colorWash} />
      <Box
        maxW="1240px"
        mx="auto"
        px={{ base: 4, md: 6 }}
        py={{ base: 6, md: 10 }}
        w="100%"
        minW={0}
        overflowX="clip"
      >
        <Text
          fontSize="xs"
          fontWeight="bold"
          letterSpacing="0.12em"
          textTransform="uppercase"
          color="whiteAlpha.500"
          mb={8}
        >
          Design mock · Rail
        </Text>
        <EventsRailDemo />
      </Box>
    </Suspense>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
