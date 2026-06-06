import { Badge, Flex, HStack, Link, Text } from '@chakra-ui/react';
import { MdHelp, MdInsights } from 'react-icons/md';
import { getFormatter, getTranslations } from 'next-intl/server';
import { Link as I18nLink } from '@i18n/navigation';
import { getNCMallDataDates, getNCMallLink, isMallDiscounted } from '@components/Items/NCMallCard';
import {
  dateMax,
  isBuyable,
  isEventActive,
  sortTradeInsightReleases,
} from '@app/_components/Item/NCTrade/ncTradeInsightsUtils';
import { TradeInsightsMore } from '@app/_components/Item/NCTrade/TradeInsightsMore';
import type { InsightsResponse, ItemData, NCMallData, UserList } from '@types';

type Props = {
  item: ItemData;
  insights: InsightsResponse;
};

export async function TradeInsights({ item, insights }: Props) {
  const t = await getTranslations();
  const releases = sortTradeInsightReleases(insights);

  return (
    <Flex direction="column" w="100%">
      <Flex bg="blackAlpha.300" p={2} borderRadius="xl" maxW="500px" flexFlow="column" gap={1}>
        <HStack color="whiteAlpha.700" mb={2}>
          <MdInsights size={24} />
          <Text fontSize="sm" fontWeight="bold" color="whiteAlpha.800">
            {t('ItemPage.release-history')}
          </Text>
        </HStack>
        {releases.slice(0, 2).map((release) => (
          <ReleaseRow key={release.internal_id} release={release} item={item} insights={insights} />
        ))}
        {releases.length > 2 && (
          <TradeInsightsMore
            labels={{
              showMore: t('ItemPage.show-more'),
              showLess: t('ItemPage.show-less'),
            }}
          >
            {releases.slice(2).map((release) => (
              <ReleaseRow
                key={release.internal_id}
                release={release}
                item={item}
                insights={insights}
              />
            ))}
          </TradeInsightsMore>
        )}
      </Flex>
    </Flex>
  );
}

type ReleaseRowProps = {
  release: NCMallData | UserList;
  item: ItemData;
  insights: InsightsResponse;
};

function ReleaseRow({ release, item, insights }: ReleaseRowProps) {
  return (
    <Flex
      bg="blackAlpha.400"
      p={2}
      borderRadius="md"
      mb={1}
      fontSize="sm"
      flexFlow="column"
      alignItems="flex-start"
      gap={1}
    >
      {(release as NCMallData).saleBegin && (
        <MallReleaseCard
          release={release as NCMallData}
          parentData={insights.parentData}
          itemData={insights.itemData}
          item={item}
        />
      )}
      {(release as UserList).name && <ListReleaseCard release={release as UserList} item={item} />}
    </Flex>
  );
}

type MallReleaseCardProps = {
  release: NCMallData;
  parentData: InsightsResponse['parentData'];
  itemData: InsightsResponse['itemData'];
  item: ItemData;
};

async function MallReleaseCard({ release, parentData, itemData, item }: MallReleaseCardProps) {
  const t = await getTranslations();
  const format = await getFormatter();
  const isLE = parentData[release.item_iid]?.isLE ?? false;
  const capItem = itemData[release.item_iid.toString()];
  const isDirect = release.item_iid === item.internal_id;
  const isDiscounted = isMallDiscounted(release);

  const hasDiscountPrice = !!(
    release.discountPrice &&
    release.discountPrice >= 0 &&
    release.discountBegin &&
    release.discountEnd
  );

  const { startDate, endDate, discountBegin, discountEnd } = getNCMallDataDates(release, item);

  const discountTooltip =
    hasDiscountPrice && discountBegin != null && discountEnd != null
      ? await getDiscountTooltipLabel(discountBegin, discountEnd)
      : null;

  return (
    <>
      <HStack>
        {isBuyable(release) && <Badge colorPalette="yellow">{t('ItemPage.buyable-now')}</Badge>}
        {!isDirect && (
          <Badge colorPalette={isLE ? 'green' : 'gray'}>{isLE ? 'LE' : 'Cap'} Prize</Badge>
        )}
        <Badge
          colorPalette="purple"
          textDecoration={
            (isBuyable(release) && isDiscounted) || (!isBuyable(release) && hasDiscountPrice)
              ? 'line-through'
              : undefined
          }
        >
          {release.price > 0 && `${format.number(release.price)} NC`}
          {release.price === 0 && t('ItemPage.free')}
        </Badge>
        {hasDiscountPrice && release.discountPrice != null && discountTooltip && (
          <Badge colorPalette="orange" title={discountTooltip} cursor="help">
            {release.discountPrice > 0
              ? `${format.number(release.discountPrice)} NC`
              : t('ItemPage.free')}
            <MdHelp
              size={12}
              style={{ display: 'inline', marginLeft: '4px', verticalAlign: 'middle' }}
            />
          </Badge>
        )}
      </HStack>
      <Text>
        {isDirect && (
          <Link
            href={getNCMallLink(item)}
            target="_blank"
            rel="noreferrer"
            data-umami-event="nc-insights"
            data-umami-event-label="nc-mall-link"
          >
            {t('Owls.direct-purchase')}
          </Link>
        )}
        {!isDirect && capItem && (
          <Link asChild>
            <I18nLink
              href={`/item/${capItem.slug}`}
              prefetch={false}
              data-umami-event="nc-insights"
              data-umami-event-label={item.name}
            >
              {capItem.name}
            </I18nLink>
          </Link>
        )}
      </Text>
      <Text fontSize="xs" color="whiteAlpha.700">
        {format.dateTime(new Date(startDate ?? 0), { dateStyle: 'medium' })}{' '}
        {endDate && <> - {format.dateTime(new Date(endDate), { dateStyle: 'medium' })}</>}
      </Text>
    </>
  );
}

async function getDiscountTooltipLabel(discountBegin: number, discountEnd: number) {
  const t = await getTranslations();
  const format = await getFormatter();

  const startDate = format.dateTime(new Date(discountBegin), { dateStyle: 'medium' });
  const endDate = format.dateTime(new Date(discountEnd), { dateStyle: 'medium' });
  const isSame = startDate === endDate;

  if (isSame) {
    return t('ItemPage.discounted-on-x', { x: startDate });
  }

  return t('ItemPage.discounted-from-x-to-y', { x: startDate, y: endDate });
}

type ListReleaseCardProps = {
  release: UserList;
  item: ItemData;
};

async function ListReleaseCard({ release, item }: ListReleaseCardProps) {
  const t = await getTranslations();
  const format = await getFormatter();
  const isActive = isEventActive(release);
  const releaseItem = release.itemInfo?.[0];
  const seriesStart =
    releaseItem?.seriesStart ||
    dateMax(new Date(release.seriesStart || 0), new Date(item.firstSeen || 0));
  const seriesEnd = releaseItem?.seriesEnd || release.seriesEnd;

  return (
    <>
      <HStack>
        {isActive && <Badge colorPalette="yellow">{t('ItemPage.buyable-now')}</Badge>}
        {release.officialTag.length > 0 && (
          <Badge colorPalette="orange">{release.officialTag[0]}</Badge>
        )}
      </HStack>
      <Text>
        <Link asChild>
          <I18nLink
            href={`/lists/official/${release.slug}`}
            prefetch={false}
            data-umami-event="nc-insights"
            data-umami-event-label={release.name}
          >
            {release.name}
          </I18nLink>
        </Link>
      </Text>
      <Text fontSize="xs" color="whiteAlpha.700">
        {format.dateTime(new Date(seriesStart ?? 0), { dateStyle: 'medium' })}
        {seriesEnd && <> - {format.dateTime(new Date(seriesEnd), { dateStyle: 'medium' })}</>}
      </Text>
    </>
  );
}

export default TradeInsights;
