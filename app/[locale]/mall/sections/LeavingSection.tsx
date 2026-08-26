import { Suspense } from 'react';
import { Flex, Skeleton, Text } from '@chakra-ui/react';
import { getFormatter, getTranslations } from 'next-intl/server';
import { HomeItem } from '@components/Card/HomeCard';
import ItemCardV2 from '@components/Items/v2/ItemCardV2';
import { getMallLeaving } from '@app/server/ncMallHub';
import { MallSectionHeader } from './MallSectionHeader';
import { MallStripAside } from './MallStripAside';

function LeavingSkeleton() {
  return (
    <Skeleton
      w="100%"
      minW={0}
      h={{ base: '260px', md: '280px' }}
      borderRadius="lg"
      bg="gray.700"
    />
  );
}

export function LeavingSection() {
  return (
    <Suspense fallback={<LeavingSkeleton />}>
      <LeavingContent />
    </Suspense>
  );
}

async function LeavingContent() {
  const [leaving, t, format] = await Promise.all([
    getMallLeaving(),
    getTranslations(),
    getFormatter(),
  ]);

  if (!leaving) return null;

  return (
    <Flex as="section" id="leaving" direction="column" gap={{ base: 4, md: 5 }} w="100%" minW={0}>
      <MallSectionHeader
        kicker={t('NcMall.leaving-kicker')}
        kickerColor="purple.200"
        title={t('NcMall.leaving-soon-tm')}
        lede={t('NcMall.leaving-lede')}
        link={{ href: '/mall/leaving', label: t('NcMall.leaving-full-list') }}
      />
      <Flex
        direction={{ base: 'column', lg: 'row' }}
        align={{ base: 'stretch', lg: 'center' }}
        gap={{ base: 4, lg: 6 }}
        minW={0}
        w="100%"
        p={{ base: 3, md: 4 }}
        bg="gray.700"
        bgGradient="linear-gradient(to top, transparent 0, rgba(139, 92, 246, 0.2) 0%)"
        borderRadius="lg"
      >
        <Flex flex="1" minW={0} wrap="wrap" justify="center" align="stretch" gap={3}>
          {leaving.stripItems.map((item) => {
            const saleEnd = item.price?.type === 'ncMall' ? item.price.saleEnd : null;
            const caption = saleEnd
              ? t('NcMall.leaving-leaves', {
                  date: format.dateTime(new Date(saleEnd), { day: 'numeric', month: 'short' }),
                })
              : t('NcMall.leaving-soon-tm');

            return (
              <Flex key={item.internal_id} direction="column" gap={2} w="150px" minW={0}>
                <ItemCardV2 item={item} uniqueID="mall-hub-leaving" style={{ width: 150 }} />
                <Text fontSize="2xs" color="whiteAlpha.600" lineHeight="1.4" lineClamp={2}>
                  {caption}
                </Text>
              </Flex>
            );
          })}
        </Flex>
        {leaving.asideItems.length > 0 && (
          <MallStripAside kicker={t('NcMall.leaving-next')} kickerColor="purple.200">
            {leaving.asideItems.map((item) => (
              <HomeItem
                key={item.internal_id}
                item={item}
                menuKey={`mall-hub-leaving-aside-${item.internal_id}`}
                utm_content="mall-hub-leaving-aside"
                showMallLeaveDate
              />
            ))}
          </MallStripAside>
        )}
      </Flex>
    </Flex>
  );
}
