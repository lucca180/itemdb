import { Badge, Box, Flex, Heading, HStack, Link, Separator, Text } from '@chakra-ui/react';
import { ItemImageV2 } from '@components/Items/v2/ItemImageV2';
import MainLink from '@components/Utils/MainLink';
import type { NcMallLebronUpdate } from '@app/[locale]/mall/_mock/ncMallHubFixtures';
import { formatDayMonth } from './editorialFormat';
import { Kicker } from './EditorialPieces';

const DIRECTION_STYLES = {
  up: { color: 'green.300', arrow: '↑', label: 'Up' },
  down: { color: 'red.300', arrow: '↓', label: 'Down' },
  new: { color: 'purple.200', arrow: '→', label: 'New' },
} as const;

type LebronDeskProps = {
  updates: NcMallLebronUpdate[];
};

/** Side rail: the market ledger that runs next to the cover story. */
export function LebronDesk({ updates }: LebronDeskProps) {
  return (
    <Flex
      direction="column"
      gap={4}
      bg="gray.700"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      p={{ base: 4, md: 5 }}
      position={{ lg: 'sticky' }}
      top={{ lg: 4 }}
    >
      <Flex direction="column" gap={2}>
        <Kicker color="yellow.200">Lebron desk</Kicker>
        <Heading as="h2" size="lg">
          Value updates
        </Heading>
        <Text fontSize="xs" color="whiteAlpha.600" css={{ textWrap: 'pretty' }}>
          Cap ranges from the latest reported NC trades. Volatile ranges are still settling.
        </Text>
      </Flex>

      <Separator borderColor="whiteAlpha.200" />

      <Flex direction="column" gap={0}>
        {updates.map((update, index) => {
          const direction = DIRECTION_STYLES[update.direction];

          return (
            <Box key={`${update.item.internal_id}-${update.pricedAt}`}>
              {index > 0 && <Separator borderColor="whiteAlpha.100" />}
              <Flex gap={3} align="center" py={3}>
                <Box
                  w="48px"
                  h="48px"
                  flexShrink={0}
                  borderRadius="md"
                  bg="blackAlpha.500"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <ItemImageV2
                    item={update.item}
                    width={40}
                    height={40}
                    style={{ objectFit: 'contain' }}
                  />
                </Box>
                <Flex direction="column" gap={1} minW={0} flex={1}>
                  <Link asChild fontSize="sm" fontWeight="semibold" lineClamp={1}>
                    <MainLink href={`/item/${update.item.slug ?? update.item.internal_id}`}>
                      {update.item.name}
                    </MainLink>
                  </Link>
                  <HStack gap={2} flexWrap="wrap" fontSize="xs">
                    <Text
                      color="whiteAlpha.500"
                      textDecoration={update.direction === 'new' ? undefined : 'line-through'}
                    >
                      {update.previousRange}
                    </Text>
                    <Text color={direction.color} fontWeight="bold">
                      {direction.arrow}
                    </Text>
                    <Badge colorPalette="yellow" size="sm">
                      {update.newRange} caps
                    </Badge>
                    {update.isVolatile && (
                      <Badge colorPalette="orange" variant="subtle" size="sm">
                        Volatile
                      </Badge>
                    )}
                  </HStack>
                  <Text fontSize="2xs" color="whiteAlpha.500">
                    {direction.label} · priced {formatDayMonth(update.pricedAt)}
                  </Text>
                </Flex>
              </Flex>
            </Box>
          );
        })}
      </Flex>

      <Separator borderColor="whiteAlpha.200" />

      <Flex direction="column" gap={1}>
        <Link asChild fontSize="sm" color="purple.200" fontWeight="semibold">
          <MainLink href="/articles/lebron">How cap values work →</MainLink>
        </Link>
        <Link asChild fontSize="sm" color="purple.200">
          <MainLink href="/mall/report">Report a trade to Lebron →</MainLink>
        </Link>
      </Flex>
    </Flex>
  );
}
