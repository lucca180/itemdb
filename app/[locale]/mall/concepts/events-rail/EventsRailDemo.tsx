import { Box, Flex, Image, Text } from '@chakra-ui/react';
import { getFormatter } from 'next-intl/server';
import MainLink from '@components/Utils/MainLink';
import { MallSectionHeader } from '@app/[locale]/mall/sections/MallSectionHeader';
import { MallStripAside } from '@app/[locale]/mall/sections/MallStripAside';
import { activeNcEvents } from '@app/[locale]/mall/_mock/ncMallHubFixtures';
import { getListLink } from '@utils/list/listLink';
import type { UserList } from '@types';

const EVENTS_WASH = 'rgba(45, 212, 191, 0.2)';
const DATE_OPTS = { day: 'numeric', month: 'short' } as const;

function seriesEndTime(event: UserList): number {
  if (!event.seriesEnd) return Number.POSITIVE_INFINITY;
  const time = new Date(event.seriesEnd).getTime();
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
}

function pickEndingSoonest(events: UserList[]): UserList | null {
  if (events.length === 0) return null;
  return [...events].sort((a, b) => seriesEndTime(a) - seriesEndTime(b))[0] ?? null;
}

export async function EventsRailDemo() {
  const format = await getFormatter();

  const captionFor = (event: UserList) => {
    if (event.seriesStart && event.seriesEnd) {
      return `${format.dateTime(new Date(event.seriesStart), DATE_OPTS)} – ${format.dateTime(
        new Date(event.seriesEnd),
        DATE_OPTS
      )}`;
    }
    if (event.seriesStart) {
      return `From ${format.dateTime(new Date(event.seriesStart), DATE_OPTS)}`;
    }
    if (event.seriesEnd) {
      return `Until ${format.dateTime(new Date(event.seriesEnd), DATE_OPTS)}`;
    }
    return 'Ongoing';
  };

  const endingSoonest = pickEndingSoonest(activeNcEvents);
  const endingSoonestEnd = endingSoonest?.seriesEnd
    ? format.dateTime(new Date(endingSoonest.seriesEnd), DATE_OPTS)
    : null;
  const endingSoonestDetail = endingSoonest
    ? [
        endingSoonestEnd ? `Ends ${endingSoonestEnd}` : 'Ongoing',
        `${endingSoonest.itemCount} items`,
      ]
        .filter(Boolean)
        .join(' · ')
    : '';

  return (
    <Flex as="section" id="events" direction="column" gap={{ base: 4, md: 5 }} w="100%" minW={0}>
      <MallSectionHeader
        kicker="Happening now"
        kickerColor="teal.200"
        title="Events & attractions"
        lede="Official lists covering the attractions, rotations, and plot prizes the mall is running this month."
        link={{ href: '/lists/official', label: 'All official lists' }}
        linkColor="teal.200"
      />
      <Flex
        direction={{ base: 'column', lg: 'row' }}
        align={{ base: 'stretch', lg: 'center' }}
        gap={{ base: 4, lg: 6 }}
        minW={0}
        w="100%"
        p={{ base: 3, md: 4 }}
        bg="gray.700"
        bgGradient={`linear-gradient(to top, transparent 0, ${EVENTS_WASH} 0%)`}
        borderRadius="lg"
      >
        <Box flex="1" minW={0} overflow="hidden">
          <Box
            w="100%"
            minW={0}
            overflowX="auto"
            pb={2}
            css={{
              display: 'grid',
              gridAutoFlow: 'column',
              gridAutoColumns: '120px',
              justifyContent: 'start',
              alignItems: 'stretch',
              gap: 'var(--chakra-spacing-3)',
              scrollSnapType: 'x proximity',
              scrollbarWidth: 'thin',
              '& > *': { scrollSnapAlign: 'start', minWidth: 0, height: '100%' },
              '&::-webkit-scrollbar': { height: '6px' },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(255,255,255,0.18)',
                borderRadius: '999px',
              },
              '@media screen and (min-width: 48em)': {
                gridAutoColumns: '150px',
              },
            }}
          >
            {activeNcEvents.map((event) => (
              <MainLink
                key={event.internal_id}
                href={getListLink(event)}
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'flex',
                  height: '100%',
                  minWidth: 0,
                }}
              >
                <Flex direction="column" gap={2} minW={0} h="100%" minH="40px">
                  <Box
                    w="100%"
                    aspectRatio="1"
                    borderRadius="md"
                    overflow="hidden"
                    bg="blackAlpha.500"
                    flexShrink={0}
                  >
                    {event.coverURL ? (
                      <Image
                        src={event.coverURL}
                        alt={event.name}
                        w="100%"
                        h="100%"
                        objectFit="cover"
                      />
                    ) : (
                      <Box w="100%" h="100%" bg="whiteAlpha.100" />
                    )}
                  </Box>
                  <Text
                    fontWeight="bold"
                    fontSize="sm"
                    lineClamp={2}
                    lineHeight="tight"
                    css={{ textWrap: 'balance' }}
                  >
                    {event.name}
                  </Text>
                  <Text
                    fontSize="2xs"
                    color="whiteAlpha.600"
                    lineHeight="1.4"
                    lineClamp={2}
                    minH="2.8em"
                    flexShrink={0}
                  >
                    {captionFor(event)}
                  </Text>
                </Flex>
              </MainLink>
            ))}
          </Box>
        </Box>
        {endingSoonest && (
          <MallStripAside
            kicker="Ending soonest"
            kickerColor="teal.200"
            title={endingSoonest.name}
            href={getListLink(endingSoonest)}
            detail={endingSoonestDetail}
          />
        )}
      </Flex>
    </Flex>
  );
}
