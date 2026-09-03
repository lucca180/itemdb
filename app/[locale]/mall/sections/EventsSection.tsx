import { Suspense } from 'react';
import { Badge, Box, Flex, Image, SimpleGrid, Skeleton, Text } from '@chakra-ui/react';
import { getTranslations } from 'next-intl/server';
import { getMallEvents, mallEventCategoryTag } from '@app/server/ncMallHub';
import MainLink from '@components/Utils/MainLink';
import { getListLink } from '@utils/list/listLink';
import { MALL_HUB_BANNER, MALL_HUB_THEME_COLOR } from '../mallHubTheme';
import { MallSectionHeader } from './MallSectionHeader';

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

const isEvent = (tag: string) => tag.toLowerCase() === 'event';
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
        link={{
          href: '/lists/official',
          label: t('NcMall.events-all-lists'),
          trackEvent: 'mall-hub-events',
          trackEventLabel: 'all-lists',
        }}
        linkColor="teal.200"
      />

      <SimpleGrid columns={{ base: 2, sm: 3, lg: 4 }} gap={3} w="100%" minW={0}>
        {events.map((event) => {
          const category = mallEventCategoryTag(event);
          const isEventTag = category && isEvent(category);
          return (
            <MainLink
              key={event.internal_id}
              href={getListLink(event)}
              trackEvent="mall-hub-events-list"
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
                gap={{ base: 2, sm: 4 }}
                h="100%"
                minH="80px"
                minW={0}
                p={{ base: 2, sm: 4 }}
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
                  borderColor: 'whiteAlpha.400',
                }}
                flexFlow={{ base: 'column', sm: 'row' }}
              >
                <Box
                  w={{ base: '40px', sm: '50px' }}
                  h={{ base: '40px', sm: '50px' }}
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

                <Flex
                  direction="column"
                  gap={1}
                  minW={0}
                  align={{ base: 'center', sm: 'flex-start' }}
                  textAlign={{ base: 'center', sm: 'left' }}
                >
                  {category && (
                    <Badge
                      colorPalette={isEventTag ? 'orange' : 'teal'}
                      variant="subtle"
                      size="xs"
                      w="fit-content"
                    >
                      {category}
                    </Badge>
                  )}
                  <Text fontWeight="bold" fontSize="sm" color="white" lineClamp={2}>
                    {event.name}
                  </Text>
                </Flex>
              </Flex>
            </MainLink>
          );
        })}
      </SimpleGrid>
    </Flex>
  );
}
