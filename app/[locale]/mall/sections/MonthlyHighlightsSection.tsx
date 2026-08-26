import { Suspense } from 'react';
import { Box, Flex, Link, SimpleGrid, Skeleton, Text } from '@chakra-ui/react';
import Color from 'color';
import { getFormatter, getTranslations } from 'next-intl/server';
import { getMallMonthlyHighlights, type MallMonthlyHighlight } from '@app/server/ncMallHub';
import { CoverPreview } from '@app/[locale]/mall/sections/CoverPreview';
import { MallSectionHeader } from '@app/[locale]/mall/sections/MallSectionHeader';
import { ItemImageV2 } from '@components/Items/v2/ItemImageV2';
import MainLink from '@components/Utils/MainLink';

function MonthlyHighlightsSkeleton() {
  return (
    <Skeleton
      w="100%"
      minW={0}
      h={{ base: '420px', md: '360px' }}
      borderRadius="xl"
      bg="gray.700"
    />
  );
}

export function MonthlyHighlightsSection() {
  return (
    <Suspense fallback={<MonthlyHighlightsSkeleton />}>
      <MonthlyHighlightsContent />
    </Suspense>
  );
}

const DATE_OPTS = { day: 'numeric', month: 'short' } as const;

function MonthlyTile({
  entry,
  kicker,
  dateLabel,
}: {
  entry: MallMonthlyHighlight;
  kicker: string;
  dateLabel: string;
}) {
  const { item, listHref, listLabel } = entry;
  const itemHref = `/item/${item.slug ?? item.internal_id}`;
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
    >
      <MainLink
        href={itemHref}
        aria-label={item.name}
        trackEvent="mall-hub-monthly"
        trackEventLabel={entry.kind}
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
            {entry.kind === 'gbc' ? (
              <Box
                flexShrink={0}
                w="100%"
                h={{ base: '160px', md: '200px' }}
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg="blackAlpha.500"
              >
                <ItemImageV2 item={item} width={80} height={80} />
              </Box>
            ) : (
              <CoverPreview
                imageId={item.image.id}
                imageHash={item.image.hash}
                name={item.name}
                description={item.description}
              />
            )}
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
              fontSize="xs"
              color="whiteAlpha.700"
              lineClamp={2}
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
        {listHref && listLabel && (
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
            <MainLink
              href={listHref}
              trackEvent="mall-hub-monthly-list"
              trackEventLabel={entry.kind}
            >
              {listLabel} →
            </MainLink>
          </Link>
        )}
      </Flex>
    </Flex>
  );
}

async function MonthlyHighlightsContent() {
  const [highlights, t, format] = await Promise.all([
    getMallMonthlyHighlights(),
    getTranslations(),
    getFormatter(),
  ]);

  if (!highlights) return null;

  const entries: {
    entry: MallMonthlyHighlight;
    kicker: string;
    dateLabel: string;
  }[] = [];

  if (highlights.ncCollectible) {
    entries.push({
      entry: highlights.ncCollectible,
      kicker: t('NcMall.monthly-nc-kicker'),
      dateLabel: format.dateTime(new Date(highlights.ncCollectible.highlightedAt), DATE_OPTS),
    });
  }
  if (highlights.premiumCollectible) {
    entries.push({
      entry: highlights.premiumCollectible,
      kicker: t('NcMall.monthly-premium-kicker'),
      dateLabel: format.dateTime(new Date(highlights.premiumCollectible.highlightedAt), DATE_OPTS),
    });
  }
  if (highlights.gbc) {
    entries.push({
      entry: highlights.gbc,
      kicker: t('NcMall.monthly-gbc-kicker'),
      dateLabel: format.dateTime(new Date(highlights.gbc.highlightedAt), DATE_OPTS),
    });
  }
  if (highlights.dyeworks) {
    entries.push({
      entry: highlights.dyeworks,
      kicker: t('NcMall.monthly-dyeworks-kicker'),
      dateLabel: t('NcMall.monthly-updated', {
        date: format.dateTime(new Date(highlights.dyeworks.highlightedAt), DATE_OPTS),
      }),
    });
  }

  if (entries.length === 0) return null;

  const lgColumns = Math.min(4, Math.max(1, entries.length)) as 1 | 2 | 3 | 4;

  return (
    <Flex
      as="section"
      id="monthly-highlights"
      direction="column"
      gap={{ base: 4, md: 5 }}
      w="100%"
      minW={0}
    >
      <MallSectionHeader
        kicker={t('NcMall.monthly-kicker')}
        kickerColor="cyan.200"
        title={t('NcMall.monthly-title')}
        lede={t('NcMall.monthly-lede')}
        link={{ href: '/lists/official', label: t('NcMall.monthly-all-lists') }}
        linkColor="cyan.200"
      />

      <SimpleGrid
        columns={{ base: 1, md: Math.min(2, entries.length), lg: lgColumns }}
        gap={{ base: 4, md: 5 }}
        w="100%"
        minW={0}
      >
        {entries.map(({ entry, kicker, dateLabel }) => (
          <MonthlyTile key={entry.kind} entry={entry} kicker={kicker} dateLabel={dateLabel} />
        ))}
      </SimpleGrid>
    </Flex>
  );
}
