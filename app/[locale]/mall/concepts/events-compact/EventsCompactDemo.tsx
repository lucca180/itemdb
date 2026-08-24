import { Badge, Box, Center, Flex, Image, SimpleGrid, Text } from '@chakra-ui/react';
import { getFormatter } from 'next-intl/server';
import { activeNcEvents, NC_MALL_HUB_THEME } from '@app/[locale]/mall/_mock/ncMallHubFixtures';
import { MallSectionHeader } from '@app/[locale]/mall/sections/MallSectionHeader';
import MainLink from '@components/Utils/MainLink';
import { getListLink } from '@utils/list/listLink';

export async function EventsCompactDemo() {
  const format = await getFormatter();

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
    >
      <Center>
        <Badge colorPalette="teal" variant="solid">
          Design mock · Compact
        </Badge>
      </Center>

      <Flex as="section" direction="column" gap={5} w="100%" minW={0}>
        <MallSectionHeader
          kicker="Happening now"
          kickerColor="teal.200"
          title="Events & attractions"
          lede="Official lists covering the attractions, rotations, and plot prizes the mall is running this month."
          link={{ href: '/lists/official', label: 'All official lists' }}
          linkColor="teal.200"
        />

        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={3} w="100%" minW={0}>
          {activeNcEvents.map((event) => {
            const start = format.dateTime(new Date(event.seriesStart!), {
              day: 'numeric',
              month: 'short',
            });
            const end = event.seriesEnd
              ? format.dateTime(new Date(event.seriesEnd), {
                  day: 'numeric',
                  month: 'short',
                })
              : 'Ongoing';

            return (
              <MainLink
                key={event.internal_id}
                href={getListLink(event)}
                style={{
                  color: 'inherit',
                  display: 'block',
                  height: '100%',
                  minHeight: 40,
                  textDecoration: 'none',
                }}
              >
                <Flex
                  align="center"
                  gap={4}
                  h="100%"
                  minH="96px"
                  minW={0}
                  p={4}
                  bg="gray.700"
                  backgroundImage={`linear-gradient(120deg, ${
                    event.colorHex ?? NC_MALL_HUB_THEME.color
                  }1f 0%, transparent 58%)`}
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor="whiteAlpha.300"
                  transition="background-color 0.15s, transform 0.15s, border-color 0.15s"
                  _hover={{
                    bgColor: 'gray.600',
                    transform: 'translateY(-2px)',
                    borderColor: 'whiteAlpha.400',
                  }}
                >
                  <Box
                    w="64px"
                    h="64px"
                    flexShrink={0}
                    overflow="hidden"
                    borderRadius="md"
                    bg="blackAlpha.300"
                  >
                    <Image
                      src={event.coverURL ?? NC_MALL_HUB_THEME.banner}
                      alt=""
                      w="100%"
                      h="100%"
                      objectFit="cover"
                    />
                  </Box>

                  <Flex direction="column" gap={1} minW={0}>
                    <Text fontWeight="bold" fontSize="sm" color="white" lineClamp={1}>
                      {event.name}
                    </Text>
                    <Text fontSize="xs" color="whiteAlpha.700">
                      {start} – {end}
                    </Text>
                    <Text fontSize="xs" color="whiteAlpha.800" lineClamp={2}>
                      {event.itemCount} items · {event.description}
                    </Text>
                  </Flex>
                </Flex>
              </MainLink>
            );
          })}
        </SimpleGrid>
      </Flex>
    </Flex>
  );
}
