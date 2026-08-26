import { Suspense } from 'react';
import { Box, Flex, Heading, Link, Skeleton, Text } from '@chakra-ui/react';
import { getFormatter, getTranslations } from 'next-intl/server';
import ItemCardV2 from '@components/Items/v2/ItemCardV2';
import MainLink from '@components/Utils/MainLink';
import { getMallCapsules } from '@app/server/ncMallHub';
import type { ItemV2For } from '@types';

const CAPSULES_WASH = 'rgba(250, 204, 21, 0.14)';
const CAPSULES_SEARCH_HREF = '/search?s=&type[]=canOpen&type[]=ncBuyable&sortBy=added&sortDir=desc';

function CapsulesSkeleton() {
  return (
    <Skeleton
      w="100%"
      minW={0}
      h={{ base: '280px', md: '320px' }}
      borderRadius="xl"
      bg="gray.700"
    />
  );
}

export function CapsulesSection() {
  return (
    <Suspense fallback={<CapsulesSkeleton />}>
      <CapsulesContent />
    </Suspense>
  );
}

function capsuleCaption(
  item: ItemV2For<'card'>,
  t: Awaited<ReturnType<typeof getTranslations>>,
  format: Awaited<ReturnType<typeof getFormatter>>
): string | null {
  const mall = item.price?.type === 'ncMall' ? item.price : null;
  if (!mall?.saleBegin) return null;

  return t('NcMall.capsules-added', {
    date: format.dateTime(new Date(mall.saleBegin), { day: 'numeric', month: 'short' }),
  });
}

async function CapsulesContent() {
  const [items, t, format] = await Promise.all([
    getMallCapsules(),
    getTranslations(),
    getFormatter(),
  ]);

  if (!items) return null;

  return (
    <Flex as="section" id="capsules" direction="column" gap={4} w="100%" minW={0} h="100%">
      <Text
        fontSize="xs"
        fontWeight="bold"
        letterSpacing="0.16em"
        textTransform="uppercase"
        color="yellow.200"
      >
        {t('NcMall.capsules-kicker')}
      </Text>
      <Box
        w="100%"
        minW={0}
        flex="1"
        bg="gray.700"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="whiteAlpha.200"
        p={{ base: 4, md: 5 }}
        bgGradient={`linear-gradient(to bottom, ${CAPSULES_WASH}, transparent 50%)`}
      >
        <Flex direction="column" gap={5} h="100%">
          <Flex direction="column" gap={2} minW={0}>
            <Heading as="h2" size="lg" css={{ textWrap: 'balance' }}>
              {t('NcMall.capsules-title')}
            </Heading>
            <Text fontSize="sm" color="whiteAlpha.700" css={{ textWrap: 'pretty' }}>
              {t('NcMall.capsules-lede')}
            </Text>
          </Flex>
          <Flex gap={3} flexWrap="wrap" justify="center">
            {items.map((item) => {
              const caption = capsuleCaption(item, t, format);
              return (
                <Flex key={item.internal_id} direction="column" gap={2} w="100px" minW={0}>
                  <ItemCardV2
                    item={item}
                    small
                    uniqueID="mall-hub-capsules"
                    style={{ width: 100 }}
                  />
                  {caption && (
                    <Text fontSize="2xs" color="whiteAlpha.600" lineHeight="1.4" lineClamp={2}>
                      {caption}
                    </Text>
                  )}
                </Flex>
              );
            })}
          </Flex>
          <Link asChild fontSize="sm" color="yellow.200" fontWeight="semibold" alignSelf="flex-end">
            <MainLink href={CAPSULES_SEARCH_HREF}>{t('NcMall.capsules-link')} →</MainLink>
          </Link>
        </Flex>
      </Box>
    </Flex>
  );
}
