import { Suspense } from 'react';
import { Box, Flex, Skeleton } from '@chakra-ui/react';
import { getFormatter, getTranslations } from 'next-intl/server';
import {
  getMallDiscountPercent,
  getMallOnSale,
  pickDeepestCut,
  type MallOnSale,
} from '@app/server/ncMallHub';
import { onSaleMallItems } from '@app/[locale]/mall/_mock/ncMallHubFixtures';
import type { ItemV2For } from '@types';
import { MallItemStrip } from './MallItemStrip';
import { MallSectionHeader } from './MallSectionHeader';
import { MallStripAside } from './MallStripAside';

const SALE_WASH = 'rgba(251, 146, 60, 0.22)';

function OnSaleSkeleton() {
  return (
    <Skeleton
      w="100%"
      minW={0}
      h={{ base: '220px', md: '240px' }}
      borderRadius="xl"
      bg="gray.700"
    />
  );
}

export function OnSaleSection() {
  return (
    <Suspense fallback={<OnSaleSkeleton />}>
      <OnSaleContent />
    </Suspense>
  );
}

function mallPrice(item: ItemV2For<'card'>) {
  if (item.price?.type !== 'ncMall') return null;
  return item.price;
}

// TODO(remove-before-deploy): mock on-sale rail when the mall has no live discounts.
function mockMallOnSale(): MallOnSale | null {
  const deepestCut = pickDeepestCut(onSaleMallItems);
  if (!deepestCut) return null;
  return { items: onSaleMallItems, deepestCut };
}

async function OnSaleContent() {
  const [liveSale, t, format] = await Promise.all([
    getMallOnSale(),
    getTranslations(),
    getFormatter(),
  ]);

  // TODO(remove-before-deploy): drop this fallback (and mockMallOnSale / fixture import).
  const sale = liveSale ?? (process.env.NODE_ENV === 'development' ? mockMallOnSale() : null);

  if (!sale) return null;

  const { items, deepestCut } = sale;
  const deepestPercent = getMallDiscountPercent(deepestCut);
  const deepestPricing = mallPrice(deepestCut);
  const deepestEnd = deepestPricing?.discountEnd
    ? format.dateTime(new Date(deepestPricing.discountEnd), { day: 'numeric', month: 'short' })
    : null;

  const captionFor = (item: ItemV2For<'card'>) => {
    const mall = mallPrice(item);
    if (!mall || mall.discountPrice === null) return t('NcMall.sale-title');
    const from = format.number(mall.price);
    const to = format.number(mall.discountPrice);
    const priceLine = t('NcMall.sale-caption-price', { from, to });
    if (!mall.discountEnd) return priceLine;
    return (
      <>
        {priceLine}
        <br />
        {t('NcMall.sale-until', {
          date: format.dateTime(new Date(mall.discountEnd), { day: 'numeric', month: 'short' }),
        })}
      </>
    );
  };

  const deepestDetail = [
    deepestPercent !== null ? t('NcMall.sale-off', { n: deepestPercent }) : null,
    deepestEnd ? t('NcMall.sale-until', { date: deepestEnd }) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Flex as="section" id="on-sale" direction="column" gap={{ base: 4, md: 5 }} w="100%" minW={0}>
      <MallSectionHeader
        kicker={t('NcMall.sale-kicker')}
        kickerColor="orange.200"
        title={t('NcMall.sale-title')}
        lede={t('NcMall.sale-lede')}
      />
      <Flex
        direction={{ base: 'column', lg: 'row' }}
        align={{ base: 'stretch', lg: 'center' }}
        gap={{ base: 4, lg: 6 }}
        minW={0}
        w="100%"
        p={{ base: 3, md: 4 }}
        bg="gray.700"
        bgGradient={`linear-gradient(to top, transparent 0, ${SALE_WASH} 0%)`}
        borderRadius="lg"
      >
        <Box flex="1" minW={0} overflow="hidden">
          <MallItemStrip
            uniqueID="mall-hub-sale"
            items={items}
            captionFor={captionFor}
            small={false}
          />
        </Box>
        <MallStripAside
          kicker={t('NcMall.sale-deepest')}
          kickerColor="orange.200"
          title={deepestCut.name}
          href={`/item/${deepestCut.slug ?? deepestCut.internal_id}`}
          detail={deepestDetail}
        />
      </Flex>
    </Flex>
  );
}
