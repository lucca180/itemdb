import { Badge, Center, Flex, Grid, Heading, Link, Text } from '@chakra-ui/react';
import Color from 'color';
import { getFormatter } from 'next-intl/server';
import {
  monthlyHighlightsFixtures,
  type MonthlyHighlightEntry,
} from '@app/[locale]/mall/_mock/ncMallHubFixtures';
import { CoverPreview } from '@app/[locale]/mall/sections/CoverPreview';
import { MallSectionHeader } from '@app/[locale]/mall/sections/MallSectionHeader';
import { ItemImageV2 } from '@components/Items/v2/ItemImageV2';
import MainLink from '@components/Utils/MainLink';

function formatHighlightDate(
  format: Awaited<ReturnType<typeof getFormatter>>,
  highlightedAt: string
) {
  return format.dateTime(new Date(highlightedAt), {
    day: 'numeric',
    month: 'short',
  });
}

function itemWash(colorHex: string | null | undefined, alpha = 0.35) {
  return Color(colorHex ?? '#67E8F9')
    .alpha(alpha)
    .hexa();
}

function CompactCallout({ entry, dateLabel }: { entry: MonthlyHighlightEntry; dateLabel: string }) {
  const { item, kicker, listSlug, listLabel } = entry;
  const wash = itemWash(item.colorHex, 0.22);

  return (
    <Flex
      direction="column"
      gap={3}
      minW={0}
      w="100%"
      p={{ base: 3, md: 4 }}
      bg="gray.700"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      bgGradient={`linear-gradient(135deg, ${wash} 0%, transparent 70%)`}
    >
      <Text
        fontSize="xs"
        fontWeight="bold"
        letterSpacing="0.14em"
        textTransform="uppercase"
        color="whiteAlpha.700"
      >
        {kicker}
      </Text>

      <Flex gap={3} align="center" minW={0} w="100%">
        <MainLink
          href={`/item/${item.slug ?? item.internal_id}`}
          aria-label={item.name}
          style={{
            color: 'inherit',
            textDecoration: 'none',
            flexShrink: 0,
            display: 'flex',
            width: 48,
            height: 48,
            minHeight: 40,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            background: 'rgba(0,0,0,0.32)',
            overflow: 'hidden',
          }}
        >
          <ItemImageV2 item={item} width={40} height={40} style={{ objectFit: 'contain' }} />
        </MainLink>

        <Flex direction="column" gap={1} minW={0} flex={1}>
          <Link asChild fontWeight="bold" fontSize="sm" lineClamp={2} minW={0}>
            <MainLink
              href={`/item/${item.slug ?? item.internal_id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                minHeight: 40,
                textDecoration: 'none',
              }}
            >
              {item.name}
            </MainLink>
          </Link>
          <Flex gap={2} flexWrap="wrap" align="center" fontSize="xs" color="whiteAlpha.700">
            <Text>{dateLabel}</Text>
            <Text color="whiteAlpha.400" aria-hidden>
              ·
            </Text>
            <Link
              asChild
              color="cyan.200"
              fontWeight="semibold"
              minH="40px"
              display="inline-flex"
              alignItems="center"
            >
              <MainLink href={`/lists/official/${listSlug}`}>{listLabel}</MainLink>
            </Link>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
}

export async function MonthlySpotlightDemo() {
  const format = await getFormatter();
  const { dyeworks, ncCollectible, premiumCollectible } = monthlyHighlightsFixtures;

  const dyeworksDate = formatHighlightDate(format, dyeworks.highlightedAt);
  const ncDate = formatHighlightDate(format, ncCollectible.highlightedAt);
  const premiumDate = formatHighlightDate(format, premiumCollectible.highlightedAt);
  const heroWash = itemWash(dyeworks.item.colorHex, 0.4);

  return (
    <Flex
      direction="column"
      gap={{ base: 8, md: 10 }}
      maxW="1240px"
      mx="auto"
      px={{ base: 2, md: 4 }}
      pt={{ base: 4, md: 6 }}
      pb={{ base: 12, md: 20 }}
      minW={0}
      w="100%"
    >
      <Center>
        <Badge colorPalette="cyan" variant="solid">
          Design mock · Spotlight
        </Badge>
      </Center>

      <Flex as="section" id="monthly-spotlight" direction="column" gap={5} w="100%" minW={0}>
        <MallSectionHeader
          kicker="This month"
          kickerColor="cyan.200"
          title="Monthly highlights"
          lede="Dyeworks leads the cover, with this month’s NC and Premium collectibles called out beside it."
          link={{ href: '/lists/official', label: 'All official lists' }}
          linkColor="cyan.200"
        />

        <Grid
          templateColumns={{ base: '1fr', lg: 'minmax(0, 2.1fr) minmax(0, 1fr)' }}
          gap={{ base: 4, lg: 5 }}
          alignItems="start"
          w="100%"
          minW={0}
        >
          {/* Dyeworks hero — cover-story hierarchy */}
          <Flex
            direction="column"
            gap={{ base: 4, md: 5 }}
            minW={0}
            w="100%"
            p={{ base: 4, md: 6 }}
            bg="gray.700"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="whiteAlpha.200"
            bgGradient={`linear-gradient(to bottom, ${heroWash}, transparent 60%)`}
          >
            <Text
              fontSize="xs"
              fontWeight="bold"
              letterSpacing="0.16em"
              textTransform="uppercase"
              color="cyan.200"
            >
              {dyeworks.kicker}
              {` · Updated ${dyeworksDate}`}
            </Text>

            <Flex
              direction={{ base: 'column', md: 'row' }}
              gap={{ base: 4, md: 6 }}
              align={{ base: 'stretch', md: 'center' }}
              minW={0}
            >
              <Flex
                direction="column"
                gap={2}
                flexShrink={0}
                w={{ base: '160px', md: '200px' }}
                alignSelf={{ base: 'center', md: 'flex-start' }}
              >
                <CoverPreview
                  imageId={dyeworks.item.image.id}
                  name={dyeworks.item.name}
                  description={dyeworks.item.description}
                />
              </Flex>

              <Flex direction="column" gap={3} minW={0} flex={1}>
                <Heading
                  as="h3"
                  size={{ base: 'xl', md: '2xl' }}
                  lineHeight="1.15"
                  lineClamp={{ base: 3, md: 2 }}
                  title={dyeworks.item.name}
                  minW={0}
                  css={{ textWrap: 'balance', overflowWrap: 'anywhere' }}
                >
                  {dyeworks.item.name}
                </Heading>

                {dyeworks.item.description && (
                  <Text
                    color="whiteAlpha.800"
                    fontSize={{ base: 'sm', md: 'md' }}
                    maxW="52ch"
                    lineClamp={4}
                    css={{ textWrap: 'pretty' }}
                  >
                    {dyeworks.item.description}
                  </Text>
                )}

                <Flex gap={3} flexWrap="wrap" align="center">
                  <Link
                    asChild
                    color="cyan.200"
                    fontWeight="semibold"
                    minH="40px"
                    display="inline-flex"
                    alignItems="center"
                  >
                    <MainLink href={`/item/${dyeworks.item.slug ?? dyeworks.item.internal_id}`}>
                      Open item →
                    </MainLink>
                  </Link>
                  <Link
                    asChild
                    color="whiteAlpha.700"
                    fontWeight="semibold"
                    fontSize="sm"
                    minH="40px"
                    display="inline-flex"
                    alignItems="center"
                  >
                    <MainLink href={`/lists/official/${dyeworks.listSlug}`}>
                      {dyeworks.listLabel} →
                    </MainLink>
                  </Link>
                </Flex>
              </Flex>
            </Flex>
          </Flex>

          {/* Compact NC / Premium callouts */}
          <Flex direction="column" gap={3} minW={0} w="100%">
            <CompactCallout entry={ncCollectible} dateLabel={ncDate} />
            <CompactCallout entry={premiumCollectible} dateLabel={premiumDate} />
          </Flex>
        </Grid>
      </Flex>
    </Flex>
  );
}
