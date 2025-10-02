import { Badge, Flex, HStack, Icon, Text, Link, Button } from '@chakra-ui/react';
import { getNCMallDataDates, getNCMallLink, isMallDiscounted } from '@components/Items/NCMallCard';
import MainLink from '@components/Utils/MainLink';
import Tooltip from '@components/Utils/Tooltip';
import { InsightsResponse, ItemData, NCMallData, UserList } from '@types';
import { useFormatter, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { MdHelp, MdInsights } from 'react-icons/md';

type TradeInsightsProps = {
  item: ItemData;
  insights: InsightsResponse;
};

export const TradeInsights = (props: TradeInsightsProps) => {
  const t = useTranslations();
  const { item, insights } = props;
  const [showMore, setShowMore] = useState(false);

  const toggleShowMore = () => setShowMore((prev) => !prev);

  const releases = useMemo(() => {
    const arr = [...insights.releases, ...insights.ncEvents];

    return arr.sort((a: any, b: any) => {
      const dateA = new Date(a.saleBegin ?? a.seriesStart);
      const dateB = new Date(b.saleBegin ?? b.seriesStart);

      // Prioritize active events or buyable releases
      if ((isEventActive(a) || isBuyable(a)) && !(isEventActive(b) || isBuyable(b))) {
        return -1;
      }

      if ((isEventActive(b) || isBuyable(b)) && !(isEventActive(a) || isBuyable(a))) {
        return 1;
      }

      return dateB.getTime() - dateA.getTime();
    });
  }, [insights]);

  return (
    <Flex direction="column">
      <Flex bg="blackAlpha.300" p={2} borderRadius={'xl'} maxW="500px" flexFlow={'column'} gap={1}>
        <HStack color="whiteAlpha.700" mb={2}>
          <Icon as={MdInsights} boxSize="24px" />
          <Text fontSize={'sm'} fontWeight={'bold'} color="whiteAlpha.800">
            {t('ItemPage.release-history')}
          </Text>
        </HStack>
        {releases.map((release, i) => {
          if (!showMore && i >= 2) return null;
          return (
            <Flex
              key={release.internal_id}
              bg="blackAlpha.400"
              p={2}
              borderRadius={'md'}
              mb={1}
              fontSize={'sm'}
              flexFlow={'column'}
              alignItems={'flex-start'}
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
              {(release as UserList).name && (
                <ListReleaseCard release={release as UserList} item={item} />
              )}
            </Flex>
          );
        })}
        {releases.length > 2 && (
          <Button size={'xs'} color="whiteAlpha.700" cursor="pointer" onClick={toggleShowMore}>
            {showMore ? t('ItemPage.show-less') : t('ItemPage.show-more')}
          </Button>
        )}
      </Flex>
    </Flex>
  );
};

type MallReleaseCardProps = {
  release: NCMallData;
  parentData: { [parent_iid: number]: { isLE: boolean } };
  itemData: { [iid: string]: ItemData };
  item: ItemData;
};

const isBuyable = (release: NCMallData) =>
  release.active && (!release.saleEnd || new Date(release.saleEnd) > new Date());

const MallReleaseCard = (props: MallReleaseCardProps) => {
  const { release, parentData, itemData, item } = props;
  const isLE = parentData[release.item_iid]?.isLE ?? false;
  const capItem = itemData[release.item_iid.toString()];
  const isDirect = release.item_iid === item.internal_id;
  const formatter = useFormatter();
  const t = useTranslations();

  const isDiscounted = isMallDiscounted(release);

  const hasDiscountPrice = !!(
    release.discountPrice &&
    release.discountPrice >= 0 &&
    release.discountBegin &&
    release.discountEnd
  );

  const { startDate, endDate, discountBegin, discountEnd } = getNCMallDataDates(release, item);

  return (
    <>
      <HStack>
        {isBuyable(release) && <Badge colorScheme="yellow">{t('ItemPage.buyable-now')}</Badge>}
        {!isDirect && (
          <Badge colorScheme={isLE ? 'green' : 'gray'}>{isLE ? 'LE' : 'Cap'} Prize</Badge>
        )}
        <Badge
          colorScheme={'purple'}
          textDecoration={
            (isBuyable(release) && isDiscounted) || (!isBuyable(release) && hasDiscountPrice)
              ? 'line-through'
              : undefined
          }
        >
          {release.price > 0 && `${formatter.number(release.price)} NC`}
          {release.price === 0 && t('ItemPage.free')}
        </Badge>
        {hasDiscountPrice && release.discountPrice && (
          <Tooltip
            label={<DiscountedText discountBegin={discountBegin} discountEnd={discountEnd} />}
          >
            <Badge colorScheme={'orange'} cursor="pointer">
              {release.discountPrice > 0 && `${formatter.number(release.discountPrice)} NC`}
              <Icon as={MdHelp} boxSize="12px" ml={1} verticalAlign={'middle'} />
            </Badge>
          </Tooltip>
        )}
      </HStack>
      <Text>
        {isDirect && (
          <Link
            as={MainLink}
            href={getNCMallLink(item)}
            isExternal
            trackEvent="nc-insights"
            trackEventLabel={'nc-mall-link'}
          >
            {t('Owls.direct-purchase')}
          </Link>
        )}
        {!isDirect && capItem && (
          <Link
            as={MainLink}
            href={`/item/${capItem.slug}`}
            prefetch={false}
            trackEvent="nc-insights"
            trackEventLabel={item.name}
          >
            {capItem.name}
          </Link>
        )}
      </Text>
      <Text fontSize={'xs'} color="whiteAlpha.700">
        {formatter.dateTime(new Date(startDate ?? 0), {
          dateStyle: 'medium',
        })}{' '}
        {endDate && (
          <>
            {' '}
            -{' '}
            {formatter.dateTime(new Date(endDate), {
              dateStyle: 'medium',
            })}
          </>
        )}
      </Text>
    </>
  );
};

type DiscountedTextProps = {
  discountBegin: number | null;
  discountEnd: number | null;
};

const DiscountedText = (props: DiscountedTextProps) => {
  const { discountBegin, discountEnd } = props;
  const t = useTranslations();
  const formatter = useFormatter();

  const startDate = formatter.dateTime(new Date(discountBegin ?? 0), {
    dateStyle: 'medium',
  });
  const endDate = formatter.dateTime(new Date(discountEnd ?? 0), {
    dateStyle: 'medium',
  });

  const isSame = startDate === endDate;

  return (
    <>
      {isSame && <>{t('ItemPage.discounted-on-x', { x: startDate })}</>}
      {!isSame && (
        <>
          {t('ItemPage.discounted-from-x-to-y', {
            x: startDate,
            y: endDate,
          })}
        </>
      )}
    </>
  );
};

type ListReleaseCardProps = {
  release: UserList;
  item?: ItemData;
};

const isEventActive = (release: UserList) => {
  const item = release.itemInfo?.[0];

  const seriesStart = item?.seriesStart || release.seriesStart;
  const seriesEnd = item?.seriesEnd || release.seriesEnd;

  return (
    seriesStart &&
    new Date(seriesStart) <= new Date() &&
    (!seriesEnd || new Date(seriesEnd) > new Date())
  );
};

const ListReleaseCard = (props: ListReleaseCardProps) => {
  const { release } = props;
  const formatter = useFormatter();
  const t = useTranslations();
  const isActive = isEventActive(release);
  const item = release.itemInfo?.[0];
  const seriesStart =
    item?.seriesStart ||
    dateMax(new Date(release.seriesStart || 0), new Date(props.item?.firstSeen || 0));
  const seriesEnd = item?.seriesEnd || release.seriesEnd;

  return (
    <>
      <HStack>
        {isActive && <Badge colorScheme="yellow">{t('ItemPage.buyable-now')}</Badge>}
        {release.officialTag && <Badge colorScheme="orange">{release.officialTag}</Badge>}
      </HStack>
      <Text>
        <Link
          as={MainLink}
          href={`/lists/official/${release.slug}`}
          prefetch={false}
          trackEvent="nc-insights"
          trackEventLabel={release.name}
        >
          {release.name}
        </Link>
      </Text>
      <Text fontSize={'xs'} color="whiteAlpha.700">
        {formatter.dateTime(new Date(seriesStart ?? 0), {
          dateStyle: 'medium',
        })}
        {seriesEnd && (
          <>
            {' '}
            -{' '}
            {formatter.dateTime(new Date(seriesEnd), {
              dateStyle: 'medium',
            })}
          </>
        )}
      </Text>
    </>
  );
};

const dateMax = (...dates: Date[]) => {
  return dates.reduce((max, date) => (date > max ? date : max), new Date(0));
};
