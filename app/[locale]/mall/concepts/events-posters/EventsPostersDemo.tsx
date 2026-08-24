import { Box, Flex, SimpleGrid, Text } from '@chakra-ui/react';
import { getFormatter } from 'next-intl/server';
import MainLink from '@components/Utils/MainLink';
import { MallSectionHeader } from '@app/[locale]/mall/sections/MallSectionHeader';
import { activeNcEvents } from '@app/[locale]/mall/_mock/ncMallHubFixtures';
import { getListLink } from '@utils/list/listLink';
import type { UserList } from '@types';

type EventPosterTileProps = {
  event: UserList;
  dateLabel: string;
};

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function EventPosterTile({ event, dateLabel }: EventPosterTileProps) {
  const washStart = hexToRgba(event.colorHex ?? '#4a4a4a', 0.45);
  const washEnd = hexToRgba(event.colorHex ?? '#4a4a4a', 0.08);

  return (
    <MainLink
      href={getListLink(event)}
      style={{ display: 'block', minHeight: 40, textDecoration: 'none', color: 'inherit' }}
    >
      <Flex
        direction="column"
        minW={0}
        w="100%"
        h="100%"
        bg="gray.700"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="whiteAlpha.150"
        overflow="hidden"
        backgroundImage={`linear-gradient(160deg, ${washStart} 0%, ${washEnd} 60%, transparent 100%)`}
        transition="transform 0.15s ease, box-shadow 0.15s ease"
        _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
      >
        {/* Cover image */}
        <Box position="relative" w="100%" aspectRatio="16/10" overflow="hidden" flexShrink={0}>
          {event.coverURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.coverURL}
              alt=""
              aria-hidden="true"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <Box
              w="100%"
              h="100%"
              backgroundImage={`linear-gradient(135deg, ${washStart}, ${washEnd})`}
            />
          )}
          {/* Bottom fade blending into the tile body */}
          <Box
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            h="40%"
            bgGradient="linear-gradient(to bottom, transparent, var(--chakra-colors-gray-700))"
            pointerEvents="none"
          />
        </Box>

        {/* Tile body */}
        <Flex direction="column" gap={1} p={{ base: 3, md: 4 }} flex={1} minW={0}>
          <Text
            fontWeight="bold"
            fontSize={{ base: 'sm', md: 'md' }}
            lineClamp={2}
            lineHeight="tight"
          >
            {event.name}
          </Text>
          {event.description && (
            <Text fontSize="xs" color="whiteAlpha.700" lineClamp={2} lineHeight="short">
              {event.description}
            </Text>
          )}
          <Flex mt="auto" pt={2} gap={3} align="center" wrap="wrap">
            <Text fontSize="xs" color="whiteAlpha.600" flexShrink={0}>
              {dateLabel}
            </Text>
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color="whiteAlpha.800"
              ml="auto"
              flexShrink={0}
            >
              {event.itemCount} items
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </MainLink>
  );
}

export async function EventsPostersDemo() {
  const format = await getFormatter();

  function formatDateRange(start: string | null, end: string | null): string {
    const opts = { month: 'short', day: 'numeric' } as const;
    if (!start) return '';
    const startLabel = format.dateTime(new Date(start), opts);
    if (!end) return `From ${startLabel}`;
    const endLabel = format.dateTime(new Date(end), opts);
    return `${startLabel} – ${endLabel}`;
  }

  return (
    <Flex
      as="section"
      id="events-posters"
      direction="column"
      gap={{ base: 4, md: 5 }}
      w="100%"
      minW={0}
    >
      <MallSectionHeader
        kicker="Happening now"
        kickerColor="teal.200"
        title="Events & attractions"
        lede="Official Neopets events, limited attractions, and curated collections — all in one place."
        link={{ href: '/lists/official', label: 'All official lists' }}
        linkColor="teal.200"
      />

      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={{ base: 4, md: 5 }} w="100%" minW={0}>
        {activeNcEvents.map((event) => (
          <EventPosterTile
            key={event.internal_id}
            event={event}
            dateLabel={formatDateRange(event.seriesStart, event.seriesEnd)}
          />
        ))}
      </SimpleGrid>
    </Flex>
  );
}
