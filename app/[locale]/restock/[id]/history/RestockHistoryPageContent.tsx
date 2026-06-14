import { Box } from '@chakra-ui/react';
import RestockHeader from '@components/Hubs/Restock/RestockHeader';
import Color from 'color';
import type { ShopInfo } from '@types';
import type { RestockHistoryPageLabels } from './buildRestockHistoryPageProps';
import { RestockHistoryPageClient } from './RestockHistoryPageClient';

type RestockHistoryPageContentProps = {
  locale: string;
  shopInfo: ShopInfo;
  labels: RestockHistoryPageLabels;
};

export function RestockHistoryPageContent({
  locale,
  shopInfo,
  labels,
}: RestockHistoryPageContentProps) {
  const shopColor = Color(shopInfo.color);

  return (
    <>
      <RestockHeader
        shop={shopInfo}
        isHistory
        historyBadge={labels.historyBadge}
        breadcrumbList={labels.breadcrumbList}
        locale={locale}
        useAppDir
        specialDayLabels={labels.specialDayLabels}
      >
        <Box css={{ '& a': { color: shopColor.lightness(70).hex() } }}>{labels.headerContent}</Box>
      </RestockHeader>
      <RestockHistoryPageClient shopInfo={shopInfo} labels={labels} />
    </>
  );
}
