import { Box, Flex, Image, Link, Text } from '@chakra-ui/react';
import { getFormatter } from 'next-intl/server';
import MainLink from '@components/Utils/MainLink';
import { MallSectionHeader } from '@app/[locale]/mall/sections/MallSectionHeader';
import { CoverPreview } from '@app/[locale]/mall/sections/CoverPreview';
import {
  monthlyHighlightsFixtures,
  type MonthlyHighlightEntry,
} from '@app/[locale]/mall/_mock/ncMallHubFixtures';

const MONTHLY_WASH = 'rgba(103, 232, 249, 0.14)';
const DATE_OPTS = { day: 'numeric', month: 'short' } as const;
const MONTH_OPTS = { month: 'long', year: 'numeric' } as const;

const HIGHLIGHTS: MonthlyHighlightEntry[] = [
  monthlyHighlightsFixtures.ncCollectible,
  monthlyHighlightsFixtures.premiumCollectible,
  monthlyHighlightsFixtures.dyeworks,
];

const KICKER_COLORS: Record<string, string> = {
  'nc-collectible': 'violet.200',
  'premium-collectible': 'pink.200',
  dyeworks: 'cyan.200',
};

function isDyeworks(entry: MonthlyHighlightEntry): boolean {
  return entry.listSlug === 'dyeworks';
}

type MonthlyHighlightCardProps = {
  entry: MonthlyHighlightEntry;
  caption: string;
};

function MonthlyHighlightCard({ entry, caption }: MonthlyHighlightCardProps) {
  const { item, kicker, listSlug, listLabel } = entry;
  const itemHref = `/item/${item.slug ?? item.internal_id}`;
  const listHref = `/lists/official/${listSlug}`;
  const kickerColor = KICKER_COLORS[listSlug] ?? 'whiteAlpha.700';

  return (
    <Flex
      direction="column"
      gap={3}
      minW={0}
      h="100%"
      p={{ base: 3, md: 4 }}
      bg="blackAlpha.300"
      borderRadius="md"
      borderWidth="1px"
      borderColor="whiteAlpha.100"
    >
      <Text
        fontSize="2xs"
        fontWeight="bold"
        letterSpacing="0.14em"
        textTransform="uppercase"
        color={kickerColor}
      >
        {kicker}
      </Text>

      <MainLink
        href={itemHref}
        style={{
          textDecoration: 'none',
          color: 'inherit',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--chakra-spacing-3)',
          minHeight: '40px',
          minWidth: 0,
        }}
      >
        {isDyeworks(entry) ? (
          <CoverPreview imageId={item.image.id} name={item.name} description={item.description} />
        ) : (
          <Box
            w="100%"
            aspectRatio="1"
            maxH={{ base: '140px', md: '160px' }}
            borderRadius="md"
            overflow="hidden"
            bg="blackAlpha.500"
            flexShrink={0}
          >
            <Image
              src={item.image.url}
              alt={item.name}
              w="100%"
              h="100%"
              objectFit="contain"
              p={2}
            />
          </Box>
        )}

        <Text
          fontWeight="bold"
          fontSize="sm"
          lineClamp={3}
          lineHeight="tight"
          css={{ textWrap: 'balance' }}
        >
          {item.name}
        </Text>

        <Text fontSize="2xs" color="whiteAlpha.600" lineHeight="1.4">
          {caption}
        </Text>
      </MainLink>

      <Link
        asChild
        fontSize="2xs"
        color={kickerColor}
        fontWeight="semibold"
        minH="40px"
        display="inline-flex"
        alignItems="center"
        w="fit-content"
      >
        <MainLink href={listHref}>{listLabel} →</MainLink>
      </Link>
    </Flex>
  );
}

export async function MonthlyRailDemo() {
  const format = await getFormatter();

  const captionFor = (entry: MonthlyHighlightEntry) => {
    const date = new Date(entry.highlightedAt);
    if (isDyeworks(entry)) {
      return `Updated ${format.dateTime(date, DATE_OPTS)}`;
    }
    return format.dateTime(date, MONTH_OPTS);
  };

  return (
    <Flex as="section" id="monthly" direction="column" gap={{ base: 4, md: 5 }} w="100%" minW={0}>
      <MallSectionHeader
        kicker="This month"
        kickerColor="cyan.200"
        title="Monthly highlights"
        lede="The NC Collectible, Premium Collectible, and current Dyeworks rotation — three official picks updated throughout the month."
        link={{ href: '/lists/official', label: 'All official lists' }}
        linkColor="cyan.200"
      />
      <Box
        w="100%"
        minW={0}
        p={{ base: 3, md: 4 }}
        bg="gray.700"
        bgGradient={`linear-gradient(to top, transparent 0, ${MONTHLY_WASH} 0%)`}
        borderRadius="lg"
        overflow="hidden"
      >
        <Box
          w="100%"
          minW={0}
          overflowX={{ base: 'auto', lg: 'visible' }}
          pb={{ base: 2, lg: 0 }}
          css={{
            display: 'grid',
            gridAutoFlow: 'column',
            gridAutoColumns: 'min(260px, 82vw)',
            gap: 'var(--chakra-spacing-3)',
            scrollSnapType: 'x proximity',
            scrollbarWidth: 'thin',
            '& > *': { scrollSnapAlign: 'start', minWidth: 0, height: '100%' },
            '&::-webkit-scrollbar': { height: '6px' },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(255,255,255,0.18)',
              borderRadius: '999px',
            },
            '@media screen and (min-width: 62em)': {
              gridAutoFlow: 'unset',
              gridAutoColumns: 'unset',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            },
          }}
        >
          {HIGHLIGHTS.map((entry) => (
            <MonthlyHighlightCard key={entry.listSlug} entry={entry} caption={captionFor(entry)} />
          ))}
        </Box>
      </Box>
    </Flex>
  );
}
