import { Suspense } from 'react';
import { Badge, Box, Flex, Heading, Link, Separator, Skeleton, Text } from '@chakra-ui/react';
import { getFormatter, getTranslations } from 'next-intl/server';
import { ItemImageV2 } from '@components/Items/v2/ItemImageV2';
import MainLink from '@components/Utils/MainLink';
import { getMallLebronUpdates, type MallLebronDirection } from '@app/server/ncMallHub';

const DIRECTION_STYLES: Record<MallLebronDirection, { color: string; arrow: string }> = {
  up: { color: 'green.300', arrow: '↑' },
  down: { color: 'red.300', arrow: '↓' },
  new: { color: 'purple.200', arrow: '→' },
};

function LebronDeskSkeleton() {
  return (
    <Skeleton
      w="100%"
      minW={0}
      h={{ base: '220px', md: '360px' }}
      borderRadius="xl"
      bg="gray.700"
    />
  );
}

export function LebronDeskSection() {
  return (
    <Suspense fallback={<LebronDeskSkeleton />}>
      <LebronDeskContent />
    </Suspense>
  );
}

async function LebronDeskContent() {
  const [updates, t, format] = await Promise.all([
    getMallLebronUpdates(),
    getTranslations(),
    getFormatter(),
  ]);

  if (!updates) return null;

  const directionLabel = {
    up: t('NcMall.lebron-up'),
    down: t('NcMall.lebron-down'),
    new: t('NcMall.lebron-new'),
  } as const;

  return (
    <Flex
      as="section"
      id="lebron"
      direction="column"
      gap={4}
      w="100%"
      minW={0}
      bg="gray.700"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      p={{ base: 4, md: 5 }}
    >
      <Flex direction="column" gap={2} minW={0}>
        <Text
          fontSize="xs"
          fontWeight="bold"
          letterSpacing="0.16em"
          textTransform="uppercase"
          color="yellow.200"
        >
          {t('NcMall.lebron-kicker')}
        </Text>
        <Heading as="h2" size={{ base: 'lg', md: 'xl' }} css={{ textWrap: 'balance' }}>
          {t('NcMall.lebron-title')}
        </Heading>
        <Text fontSize="xs" color="whiteAlpha.600" css={{ textWrap: 'pretty' }}>
          {t('NcMall.lebron-lede')}
        </Text>
      </Flex>

      <Separator borderColor="whiteAlpha.200" />

      <Flex direction="column" gap={0} minW={0}>
        {updates.map((update, index) => {
          const direction = DIRECTION_STYLES[update.direction];
          const pricedLabel = format.dateTime(new Date(update.pricedAt), {
            day: 'numeric',
            month: 'short',
          });

          return (
            <Box key={`${update.item.internal_id}-${update.pricedAt}`} minW={0}>
              {index > 0 && <Separator borderColor="whiteAlpha.100" />}
              <Flex gap={3} align="center" py={3} minW={0}>
                <Box
                  w={{ base: '40px', md: '48px' }}
                  h={{ base: '40px', md: '48px' }}
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
                  <Flex gap={2} flexWrap="wrap" align="center" fontSize="xs" minW={0}>
                    {update.direction !== 'new' && (
                      <>
                        {update.previousRange && (
                          <Text color="whiteAlpha.500" textDecoration="line-through">
                            {update.previousRange}
                          </Text>
                        )}
                        <Text color={direction.color} fontWeight="bold" aria-hidden="true">
                          {direction.arrow}
                        </Text>
                      </>
                    )}
                    <Badge colorPalette="yellow" size="sm">
                      {t('NcMall.lebron-caps', { range: update.newRange })}
                    </Badge>
                    {update.isVolatile && (
                      <Badge colorPalette="orange" variant="subtle" size="sm">
                        {t('NcMall.lebron-volatile')}
                      </Badge>
                    )}
                  </Flex>
                  {update.direction !== 'new' && (
                    <Text fontSize="2xs" color="whiteAlpha.500">
                      {directionLabel[update.direction]} ·{' '}
                      {t('NcMall.lebron-priced', { date: pricedLabel })}
                    </Text>
                  )}
                </Flex>
              </Flex>
            </Box>
          );
        })}
      </Flex>

      <Separator borderColor="whiteAlpha.200" />

      <Flex direction="column" gap={1} minW={0}>
        <Link asChild fontSize="sm" color="purple.200" fontWeight="semibold" w="fit-content">
          <MainLink href="/articles/lebron">{t('NcMall.lebron-how')} →</MainLink>
        </Link>
        <Link asChild fontSize="sm" color="purple.200" w="fit-content">
          <MainLink href="/mall/report">{t('NcMall.lebron-report')} →</MainLink>
        </Link>
      </Flex>
    </Flex>
  );
}
