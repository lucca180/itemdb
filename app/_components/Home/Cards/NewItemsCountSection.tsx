import { Suspense } from 'react';
import { unstable_cache } from 'next/cache';
import NextImage from 'next/image';
import { Flex, styled } from '@styled/jsx';
import { getTranslations } from 'next-intl/server';
import { getNewItemsInfo } from '@pages/api/v1/beta/new-items';
import { HorizontalHomeCard } from '@app/_components/Home/Cards/HorizontalHomeCard';

const getCachedNewItemsCount = unstable_cache(
  async () => getNewItemsInfo(7).catch(() => null),
  ['home-server-cards', 'new-item-count'],
  {
    tags: ['home-new-item-count'],
    revalidate: 300,
  }
);

export function NewItemsCountSection() {
  return (
    <Suspense fallback={null}>
      <NewItemsCountSectionContent />
    </Suspense>
  );
}

async function NewItemsCountSectionContent() {
  const t = await getTranslations();
  const newItemCount = await getCachedNewItemsCount();

  if (!newItemCount) return null;

  return (
    <Flex gap={4} flexWrap="wrap" flexFlow={{ base: 'column', lg: 'row' }}>
      <HorizontalHomeCard
        headerColor="#B794F4"
        bgOpacity="0.75"
        innerCss={{ border: 0, py: 2 }}
        rootCss={{ flex: '1' }}
      >
        <Flex alignItems="center">
          <NextImage
            src={
              newItemCount.paidItems > newItemCount.freeItems * 2
                ? 'https://images.neopets.com/caption/sm_caption_1100.gif'
                : 'https://images.neopets.com/nt/ntimages/332_nc_mall.gif'
            }
            alt=""
            width={100}
            height={100}
            quality={100}
            style={{ borderRadius: '0.375rem' }}
          />
          <Flex flexFlow="column" ml={3}>
            <styled.p fontSize="lg" fontWeight="bold">
              {t.rich('HomePage.new-paid-items', {
                Highlight: (chunks) => (
                  <styled.span color="purple.700" bg="purple.200" px={1} borderRadius="md">
                    {chunks}
                  </styled.span>
                ),
                days: 7,
              })}
            </styled.p>
            <styled.p fontSize="4xl" fontWeight="bold">
              {newItemCount.paidItems}
            </styled.p>
            <styled.p fontSize="xs" color="whiteAlpha.700">
              {t('HomePage.new-paid-items-text')}
            </styled.p>
          </Flex>
        </Flex>
      </HorizontalHomeCard>
      <HorizontalHomeCard
        headerColor="#F6AD55"
        bgOpacity="0.75"
        innerCss={{ border: 0, py: 2 }}
        rootCss={{ flex: '1' }}
      >
        <Flex alignItems="center">
          <NextImage
            src="https://images.neopets.com/nt/ntimages/475_money_tree.gif"
            alt=""
            width={100}
            height={100}
            quality={100}
            style={{ borderRadius: '0.375rem' }}
          />
          <Flex flexFlow="column" ml={3}>
            <styled.p fontSize="lg" fontWeight="bold">
              {t.rich('HomePage.new-free-items', {
                Highlight: (chunks) => (
                  <styled.span color="orange.600" bg="orange.100" px={1} borderRadius="md">
                    {chunks}
                  </styled.span>
                ),
                days: 7,
              })}
            </styled.p>
            <styled.p fontSize="4xl" fontWeight="bold">
              {newItemCount.freeItems}
            </styled.p>
            <styled.p fontSize="xs" color="whiteAlpha.800">
              {t('HomePage.new-free-items-text')}
            </styled.p>
          </Flex>
        </Flex>
      </HorizontalHomeCard>
    </Flex>
  );
}
