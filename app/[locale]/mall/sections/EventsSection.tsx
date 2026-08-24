import { Suspense } from 'react';
import { Badge, Box, Flex, Image, SimpleGrid, Skeleton, Text } from '@chakra-ui/react';
import { getTranslations } from 'next-intl/server';
import { getMallEvents, mallEventCategoryTag } from '@app/server/ncMallHub';
import MainLink from '@components/Utils/MainLink';
import { getListLink } from '@utils/list/listLink';
import { MALL_HUB_BANNER, MALL_HUB_THEME_COLOR } from '../mallHubTheme';
import { MallSectionHeader } from './MallSectionHeader';

/** List descriptions are often markdown; compact cards show plain text only. */
function plainListDescription(value: string | null | undefined): string | null {
  if (!value) return null;
  const plain = value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return plain || null;
}

function EventsSkeleton() {
  return (
    <Skeleton
      w="100%"
      minW={0}
      h={{ base: '220px', md: '260px' }}
      borderRadius="lg"
      bg="gray.700"
    />
  );
}

export function EventsSection() {
  return (
    <Suspense fallback={<EventsSkeleton />}>
      <EventsContent />
    </Suspense>
  );
}

async function EventsContent() {
  const [events, t] = await Promise.all([getMallEvents(), getTranslations()]);

  if (!events) return null;

  return (
    <Flex as="section" id="events" direction="column" gap={{ base: 4, md: 5 }} w="100%" minW={0}>
      <MallSectionHeader
        kicker={t('NcMall.events-kicker')}
        kickerColor="teal.200"
        title={t('NcMall.events-title')}
        lede={t('NcMall.events-lede')}
        link={{ href: '/lists/official', label: t('NcMall.events-all-lists') }}
        linkColor="teal.200"
      />

      <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={3} w="100%" minW={0}>
        {events.map((event) => {
          const category = mallEventCategoryTag(event);
          const itemLine =
            event.itemCount != null ? t('NcMall.events-items', { count: event.itemCount }) : null;
          const detail = [itemLine, plainListDescription(event.description)]
            .filter(Boolean)
            .join(' · ');

          return (
            <MainLink
              key={event.internal_id}
              href={getListLink(event)}
              trackEvent="mall-hub-events"
              trackEventLabel={event.slug ?? String(event.internal_id)}
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
                  event.colorHex ?? MALL_HUB_THEME_COLOR
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
                    src={event.coverURL ?? MALL_HUB_BANNER}
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
                  {category && (
                    <Badge colorPalette="teal" variant="subtle" size="sm" w="fit-content">
                      {category}
                    </Badge>
                  )}
                  {detail && (
                    <Text fontSize="xs" color="whiteAlpha.800" lineClamp={2}>
                      {detail}
                    </Text>
                  )}
                </Flex>
              </Flex>
            </MainLink>
          );
        })}
      </SimpleGrid>
    </Flex>
  );
}
