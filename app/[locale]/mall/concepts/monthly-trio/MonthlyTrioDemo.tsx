import { Box, Flex, Link, SimpleGrid, Text } from '@chakra-ui/react';
import Color from 'color';
import { getFormatter } from 'next-intl/server';
import {
  monthlyHighlightsFixtures,
  type MonthlyHighlightEntry,
} from '@app/[locale]/mall/_mock/ncMallHubFixtures';
import { CoverPreview } from '@app/[locale]/mall/sections/CoverPreview';
import { MallSectionHeader } from '@app/[locale]/mall/sections/MallSectionHeader';
import MainLink from '@components/Utils/MainLink';

const HIGHLIGHTS: MonthlyHighlightEntry[] = [
  monthlyHighlightsFixtures.ncCollectible,
  monthlyHighlightsFixtures.premiumCollectible,
  monthlyHighlightsFixtures.dyeworks,
];

const DATE_OPTS = { day: 'numeric', month: 'short' } as const;

function isDyeworks(entry: MonthlyHighlightEntry): boolean {
  return entry.listSlug === 'dyeworks';
}

type TrioTileProps = {
  entry: MonthlyHighlightEntry;
  dateLabel: string;
};

function TrioTile({ entry, dateLabel }: TrioTileProps) {
  const { item, kicker, listSlug, listLabel } = entry;
  const itemHref = `/item/${item.slug ?? item.internal_id}`;
  const listHref = `/lists/official/${listSlug}`;
  const accent = Color(item.colorHex ?? '#A1A1AA');
  const wash = accent.alpha(0.42).hexa();
  const washSoft = accent.alpha(0.12).hexa();
  const borderTint = accent.alpha(0.45).hexa();
  const kickerTint = accent.lightness(80).hex();
  const previewWell = accent.alpha(0.28).hexa();

  return (
    <Flex
      direction="column"
      minW={0}
      w="100%"
      h="100%"
      bg="gray.700"
      borderRadius="xl"
      borderWidth="1px"
      borderColor={borderTint}
      overflow="hidden"
      bgGradient={`linear-gradient(165deg, ${wash} 0%, ${washSoft} 45%, transparent 78%)`}
      transition="transform 0.15s ease, box-shadow 0.15s ease"
      _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
    >
      <MainLink
        href={itemHref}
        aria-label={item.name}
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minWidth: 0,
          minHeight: 40,
          textDecoration: 'none',
          color: 'inherit',
        }}
      >
        <Box p={{ base: 3, md: 4 }} pb={0} minW={0}>
          <Box
            borderRadius="lg"
            overflow="hidden"
            bg={previewWell}
            borderWidth="1px"
            borderColor={accent.alpha(0.25).hexa()}
          >
            <CoverPreview
              imageId={item.image.id}
              imageHash={item.image.hash}
              name={item.name}
              description={item.description}
              imageScale={0.82}
            />
          </Box>
        </Box>

        <Flex direction="column" gap={1.5} p={{ base: 3, md: 4 }} flex={1} minW={0}>
          <Text
            fontSize="xs"
            fontWeight="bold"
            letterSpacing="0.14em"
            textTransform="uppercase"
            color={kickerTint}
          >
            {kicker}
          </Text>
          <Text
            fontWeight="bold"
            fontSize={{ base: 'sm', md: 'md' }}
            lineClamp={2}
            lineHeight="tight"
            css={{ textWrap: 'balance', overflowWrap: 'anywhere' }}
          >
            {item.name}
          </Text>
          {item.description && (
            <Text
              fontSize="sm"
              color="whiteAlpha.800"
              lineClamp={3}
              lineHeight="short"
              css={{ textWrap: 'pretty' }}
            >
              {item.description}
            </Text>
          )}
        </Flex>
      </MainLink>

      <Flex
        mt="auto"
        px={{ base: 3, md: 4 }}
        pb={{ base: 3, md: 4 }}
        gap={3}
        align="center"
        wrap="wrap"
        minW={0}
      >
        <Text fontSize="xs" color="whiteAlpha.600" flexShrink={0}>
          {dateLabel}
        </Text>
        <Link
          asChild
          fontSize="xs"
          fontWeight="semibold"
          color={kickerTint}
          ml="auto"
          flexShrink={0}
          minH="40px"
          display="inline-flex"
          alignItems="center"
        >
          <MainLink href={listHref}>{listLabel} →</MainLink>
        </Link>
      </Flex>
    </Flex>
  );
}

export async function MonthlyTrioDemo() {
  const format = await getFormatter();

  const dateLabelFor = (entry: MonthlyHighlightEntry) => {
    const formatted = format.dateTime(new Date(entry.highlightedAt), DATE_OPTS);
    return isDyeworks(entry) ? `Updated ${formatted}` : formatted;
  };

  return (
    <Flex
      as="section"
      id="monthly-trio"
      direction="column"
      gap={{ base: 4, md: 5 }}
      w="100%"
      minW={0}
    >
      <MallSectionHeader
        kicker="This month"
        kickerColor="cyan.200"
        title="Monthly highlights"
        lede="Three equal of-the-month picks: the NC Collectible, Premium Collectible, and current Dyeworks rotation."
        link={{ href: '/lists/official', label: 'All official lists' }}
        linkColor="cyan.200"
      />

      <SimpleGrid columns={{ base: 1, lg: 3 }} gap={{ base: 4, md: 5 }} w="100%" minW={0}>
        {HIGHLIGHTS.map((entry) => (
          <TrioTile key={entry.listSlug} entry={entry} dateLabel={dateLabelFor(entry)} />
        ))}
      </SimpleGrid>
    </Flex>
  );
}
