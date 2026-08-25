import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import { NC_MALL_HUB_THEME } from '@app/[locale]/mall/_mock/ncMallHubFixtures';
import { getStaticAppMetadata } from '@app/utils/appPage';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { SetMainColor } from '@components/Layout/SetMainColor';
import MainLink from '@components/Utils/MainLink';
import { routing } from '@utils/locales';

const TITLE = 'NC Mall Hub — Monthly highlights concepts';
const DESCRIPTION =
  'Compare three temporary layout directions for the NC Mall hub Monthly highlights section.';

const DEMOS = [
  {
    href: '/mall/concepts/monthly-trio',
    label: 'Trio',
    blurb:
      'Equal three-up tiles — each “of the month” card weighted the same; Dyeworks preview inside its tile.',
  },
  {
    href: '/mall/concepts/monthly-spotlight',
    label: 'Spotlight',
    blurb: 'Dyeworks as cover-story hero with wearable preview; NC & Premium as compact callouts.',
  },
  {
    href: '/mall/concepts/monthly-rail',
    label: 'Rail',
    blurb:
      'Horizontal strip of three cards with captions — sale/leaving DNA, Dyeworks preview inline.',
  },
] as const;

export async function generateMetadata(): Promise<Metadata> {
  return getStaticAppMetadata({
    title: TITLE,
    description: DESCRIPTION,
    pathname: '/mall/concepts/monthly',
    noindex: true,
    nofollow: true,
  });
}

export default function MonthlyConceptsIndexPage() {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <SetMainColor color={NC_MALL_HUB_THEME.colorWash} />
      <Box
        maxW="760px"
        mx="auto"
        px={{ base: 4, md: 6 }}
        py={{ base: 8, md: 12 }}
        w="100%"
        minW={0}
      >
        <Flex direction="column" gap={6} minW={0}>
          <Flex direction="column" gap={2} minW={0}>
            <Text
              fontSize="xs"
              fontWeight="bold"
              letterSpacing="0.12em"
              textTransform="uppercase"
              color="whiteAlpha.500"
            >
              Design mock · Monthly highlights
            </Text>
            <Heading as="h1" size={{ base: 'xl', md: '2xl' }} css={{ textWrap: 'balance' }}>
              Monthly highlights directions
            </Heading>
            <Text color="whiteAlpha.700" fontSize="sm" css={{ textWrap: 'pretty' }}>
              Temporary fixtures-only demos for a new Mall Hub section: NC Collectible of the month,
              Premium of the month, and Current Dyeworks (wearable preview + update date). Pick one
              (or a hybrid) before porting to production.
            </Text>
          </Flex>

          <Flex direction="column" gap={3} w="100%" minW={0}>
            {DEMOS.map((demo) => (
              <MainLink
                key={demo.href}
                href={demo.href}
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'block',
                  minHeight: 40,
                }}
              >
                <Flex
                  direction="column"
                  gap={1}
                  p={4}
                  bg="gray.700"
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor="whiteAlpha.300"
                  minW={0}
                  transition="background 0.15s, border-color 0.15s, transform 0.15s"
                  _hover={{
                    bg: 'gray.600',
                    borderColor: 'whiteAlpha.400',
                    transform: 'translateY(-2px)',
                  }}
                >
                  <Text fontWeight="bold" fontSize="md" color="purple.200">
                    {demo.label} →
                  </Text>
                  <Text fontSize="sm" color="whiteAlpha.700" css={{ textWrap: 'pretty' }}>
                    {demo.blurb}
                  </Text>
                </Flex>
              </MainLink>
            ))}
          </Flex>
        </Flex>
      </Box>
    </Suspense>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
