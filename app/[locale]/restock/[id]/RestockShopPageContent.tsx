import { Box, Flex, Heading, Link, Separator, Text } from '@chakra-ui/react';
import ShopCard from '@components/Hubs/Restock/ShopCard';
import RestockHeader from '@components/Hubs/Restock/RestockHeader';
import MainLink from '@components/Utils/MainLink';
import Color from 'color';
import type { ItemV2For, ShopInfo } from '@types';
import type { RestockShopClientLabels, RestockShopPageLabels } from './buildRestockShopPageProps';
import { RestockShopPageClient } from './RestockShopPageClient';

type RestockShopPageContentProps = {
  locale: string;
  routeId: string;
  shopInfo: ShopInfo;
  similarShops: ShopInfo[];
  initialItems: ItemV2For<'card'>[];
  needsFullLoad: boolean;
  labels: RestockShopPageLabels;
};

export function RestockShopPageContent({
  locale,
  routeId,
  shopInfo,
  similarShops,
  initialItems,
  needsFullLoad,
  labels,
}: RestockShopPageContentProps) {
  const shopColor = Color(shopInfo.color);
  const clientLabels: RestockShopClientLabels = {
    items: labels.items,
    sortBy: labels.sortBy,
    useClassicView: labels.useClassicView,
    useRarityView: labels.useRarityView,
  };

  return (
    <>
      <RestockHeader
        shop={shopInfo}
        breadcrumbList={labels.breadcrumbList}
        locale={locale}
        useAppDir
        historyCta={labels.historyCta}
        specialDayLabels={labels.specialDayLabels}
      >
        <Box css={{ '& a': { color: shopColor.lightness(70).hex() } }}>{labels.headerContent}</Box>
      </RestockHeader>
      <Separator my={3} />
      <RestockShopPageClient
        key={routeId}
        routeId={routeId}
        locale={locale}
        shopInfo={shopInfo}
        initialItems={initialItems}
        needsFullLoad={needsFullLoad}
        labels={clientLabels}
      />
      <Text textAlign="center" mt={8} fontSize="xs">
        {labels.bmgWarning}
      </Text>
      <Text textAlign="center" fontSize="xs">
        <br />
        {labels.infoUpToDateWarning}
        <br />
        <Link asChild color="gray.400">
          <MainLink href="/contribute" prefetch={false}>
            {labels.learnHelp}
          </MainLink>
        </Link>
      </Text>
      <Flex flexFlow="column" mt={10} gap={3} p={5} borderRadius="lg" bg="blackAlpha.500">
        <Heading size="lg">{labels.similarShops}</Heading>
        <Flex gap={5} flexWrap="wrap" justifyContent="center">
          {similarShops.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
        </Flex>
      </Flex>
    </>
  );
}
