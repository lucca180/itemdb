import { Badge, Box, Center, Flex, Heading, HStack, Image, Link, Text } from '@chakra-ui/react';
import { getFormatter } from 'next-intl/server';
import { activeNcEvents } from '@app/[locale]/mall/_mock/ncMallHubFixtures';
import { MallSectionHeader } from '@app/[locale]/mall/sections/MallSectionHeader';
import MainLink from '@components/Utils/MainLink';
import { getListLink } from '@utils/list/listLink';

function formatEventDates(
  format: Awaited<ReturnType<typeof getFormatter>>,
  start: string | null | undefined,
  end: string | null | undefined
) {
  const startFormatted = start
    ? format.dateTime(new Date(start), {
        day: 'numeric',
        month: 'short',
      })
    : null;

  const endFormatted = end
    ? format.dateTime(new Date(end), {
        day: 'numeric',
        month: 'short',
      })
    : null;

  if (startFormatted && endFormatted) {
    return `${startFormatted} – ${endFormatted}`;
  }
  if (startFormatted) {
    return `From ${startFormatted}`;
  }
  if (endFormatted) {
    return `Until ${endFormatted}`;
  }
  return 'Active';
}

export async function EventsHeroDemo() {
  const format = await getFormatter();
  const [featuredEvent, ...siblingEvents] = activeNcEvents;
  const featuredDates = formatEventDates(
    format,
    featuredEvent.seriesStart,
    featuredEvent.seriesEnd
  );

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
        <Badge colorPalette="teal" variant="solid">
          Design mock · Hero
        </Badge>
      </Center>

      <Flex as="section" id="events-hero" direction="column" gap={5} w="100%" minW={0}>
        <MallSectionHeader
          kicker="Happening now"
          kickerColor="teal.200"
          title="Events & attractions"
          lede="Official lists covering the attractions, rotations, and plot prizes the mall is running this month."
          link={{ href: '/lists/official', label: 'All official lists' }}
          linkColor="teal.200"
        />

        {/* Hero block */}
        <Flex
          direction="column"
          gap={{ base: 4, md: 5 }}
          p={{ base: 4, md: 6 }}
          bg="gray.700"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="whiteAlpha.200"
          bgGradient={`linear-gradient(135deg, ${featuredEvent.colorHex}2b 0%, transparent 65%)`}
          minW={0}
          w="100%"
        >
          <Box
            w="100%"
            h={{ base: '140px', sm: '180px', md: '220px' }}
            borderRadius="lg"
            overflow="hidden"
            bg="blackAlpha.400"
            position="relative"
            minW={0}
          >
            {featuredEvent.coverURL && (
              <Image
                src={featuredEvent.coverURL}
                alt={featuredEvent.name}
                w="100%"
                h="100%"
                objectFit="cover"
                objectPosition="center"
              />
            )}
          </Box>

          <Flex
            direction={{ base: 'column', md: 'row' }}
            justify="space-between"
            align={{ base: 'flex-start', md: 'flex-end' }}
            gap={{ base: 4, md: 6 }}
            minW={0}
            w="100%"
            pt={1}
          >
            <Flex direction="column" gap={2} minW={0} flex={1}>
              <HStack gap={2} flexWrap="wrap">
                <Badge colorPalette="teal" variant="solid" size="sm">
                  Featured attraction
                </Badge>
                <Text fontSize="xs" color="whiteAlpha.700">
                  {featuredDates}
                </Text>
                <Text fontSize="xs" color="whiteAlpha.500" aria-hidden>
                  ·
                </Text>
                <Text fontSize="xs" color="whiteAlpha.700">
                  {featuredEvent.itemCount} items
                </Text>
              </HStack>

              <Heading
                as="h3"
                size={{ base: 'xl', md: '2xl' }}
                lineHeight="1.15"
                css={{ textWrap: 'balance' }}
              >
                {featuredEvent.name}
              </Heading>

              {featuredEvent.description && (
                <Text
                  fontSize={{ base: 'sm', md: 'md' }}
                  color="whiteAlpha.800"
                  maxW="65ch"
                  lineClamp={{ base: 2, md: 3 }}
                  css={{ textWrap: 'pretty' }}
                >
                  {featuredEvent.description}
                </Text>
              )}
            </Flex>

            <Link asChild fontSize="sm" color="teal.200" fontWeight="bold" flexShrink={0}>
              <MainLink
                href={getListLink(featuredEvent)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  textDecoration: 'none',
                }}
              >
                View list →
              </MainLink>
            </Link>
          </Flex>
        </Flex>

        {/* Stacked compact sibling rows */}
        <Flex direction="column" gap={2.5} w="100%" minW={0}>
          {siblingEvents.map((event) => {
            const dates = formatEventDates(format, event.seriesStart, event.seriesEnd);

            return (
              <MainLink
                key={event.internal_id}
                href={getListLink(event)}
                style={{
                  color: 'inherit',
                  display: 'block',
                  width: '100%',
                  minHeight: 40,
                  textDecoration: 'none',
                }}
              >
                <Flex
                  align="center"
                  justify="space-between"
                  gap={{ base: 3, md: 4 }}
                  minH="56px"
                  minW={0}
                  w="100%"
                  p={{ base: 2.5, md: 3 }}
                  bg="gray.700"
                  backgroundImage={`linear-gradient(120deg, ${event.colorHex}1f 0%, transparent 60%)`}
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor="whiteAlpha.200"
                  transition="background-color 0.15s, transform 0.15s, border-color 0.15s"
                  _hover={{
                    bgColor: 'gray.600',
                    transform: 'translateY(-1px)',
                    borderColor: 'whiteAlpha.400',
                  }}
                >
                  <HStack gap={{ base: 3, md: 4 }} minW={0} flex={1}>
                    <Box
                      w={{ base: '48px', md: '56px' }}
                      h={{ base: '48px', md: '56px' }}
                      flexShrink={0}
                      overflow="hidden"
                      borderRadius="md"
                      bg="blackAlpha.300"
                    >
                      {event.coverURL && (
                        <Image
                          src={event.coverURL}
                          alt={event.name}
                          w="100%"
                          h="100%"
                          objectFit="cover"
                        />
                      )}
                    </Box>

                    <Flex direction="column" gap={0.5} minW={0} flex={1}>
                      <Text
                        fontWeight="bold"
                        fontSize={{ base: 'sm', md: 'md' }}
                        color="white"
                        lineClamp={1}
                      >
                        {event.name}
                      </Text>
                      <HStack gap={2} fontSize="xs" color="whiteAlpha.700" flexWrap="wrap">
                        <Text>{dates}</Text>
                        <Text color="whiteAlpha.400" aria-hidden>
                          ·
                        </Text>
                        <Text>{event.itemCount} items</Text>
                        {event.description && (
                          <>
                            <Text
                              color="whiteAlpha.400"
                              aria-hidden
                              display={{ base: 'none', lg: 'inline' }}
                            >
                              ·
                            </Text>
                            <Text
                              color="whiteAlpha.600"
                              lineClamp={1}
                              display={{ base: 'none', lg: 'inline' }}
                            >
                              {event.description}
                            </Text>
                          </>
                        )}
                      </HStack>
                    </Flex>
                  </HStack>

                  <Text
                    fontSize="sm"
                    color="teal.200"
                    fontWeight="semibold"
                    flexShrink={0}
                    pe={2}
                    display={{ base: 'none', sm: 'inline-flex' }}
                    alignItems="center"
                    gap={1}
                  >
                    View list →
                  </Text>
                </Flex>
              </MainLink>
            );
          })}
        </Flex>
      </Flex>
    </Flex>
  );
}
