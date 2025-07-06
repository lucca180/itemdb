import { Center, Flex, HStack, Tag, Text, Link, Badge } from '@chakra-ui/react';
import React from 'react';
import { ItemData, ItemMallData, NCMallData } from '../../types';
import CardBase from '../Card/CardBase';
import Image from 'next/image';
import { useFormatter, useTranslations } from 'next-intl';
import { UTCDate } from '@date-fns/utc';

type Props = {
  item: ItemData;
  ncMallData: NCMallData;
};

const NcMallCard = (props: Props) => {
  const t = useTranslations();
  const format = useFormatter();
  const { item, ncMallData } = props;

  const isDiscounted = isMallDiscounted(ncMallData);

  const isBuyable =
    ncMallData.active && (!ncMallData.saleEnd || new Date(ncMallData.saleEnd) > new Date());

  const { startDate, endDate } = getNCMallDataDates(ncMallData, item);

  return (
    <CardBase title={t('ItemPage.nc-mall-info')} color={item.color.rgb}>
      <Flex flexFlow={'column'} gap={2}>
        <Center flexFlow="column" gap={2}>
          <Link href={getNCMallLink(item)} isExternal>
            <Image
              src={'https://images.neopets.com/ncmall/shopkeepers/exclusive_shop1.png'}
              width={600}
              height={200}
              priority
              alt="nc mall thumb"
              quality={100}
            />
          </Link>
          {isBuyable && !isDiscounted && (
            <Badge fontSize="xs" colorScheme={'yellow'}>
              {t('ItemPage.buyable-right-now')}
            </Badge>
          )}
          {isBuyable && isDiscounted && (
            <Badge fontSize="xs" colorScheme={'orange'}>
              {t('ItemPage.on-sale')}
            </Badge>
          )}
          {!isBuyable && (
            <Badge fontSize="xs" colorScheme={'red'}>
              {t('ItemPage.retired')}
            </Badge>
          )}
        </Center>
        <HStack>
          <Tag size="md" fontWeight="bold" as="h3">
            {t('General.price')}
          </Tag>
          <Flex flexFlow={'column'} flex="1" alignItems={'flex-end'} gap={1}>
            {isDiscounted && (
              <Badge
                fontSize="xs"
                colorScheme={isDiscounted ? 'orange' : undefined}
                textAlign={'right'}
              >
                {ncMallData.discountPrice} NC <br /> {t('General.until')}{' '}
                {format.dateTime(new Date(ncMallData.discountEnd ?? 0), {
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                })}
              </Badge>
            )}
            <Badge
              fontSize="xs"
              colorScheme={isDiscounted ? undefined : 'purple'}
              textDecoration={isDiscounted ? 'line-through' : undefined}
            >
              {ncMallData.price > 0 && `${ncMallData.price} NC`}
              {ncMallData.price === 0 && t('ItemPage.free')}
            </Badge>
          </Flex>
        </HStack>
        {startDate && (
          <HStack>
            <Tag size="md" fontWeight="bold" as="h3">
              {t('ItemPage.since')}
            </Tag>
            <Flex flexFlow={'column'} flex="1" alignItems={'flex-end'} gap={1}>
              <Text fontSize="xs" textAlign={'right'}>
                {format.dateTime(startDate, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </Flex>
          </HStack>
        )}
        {endDate && (
          <HStack>
            <Tag size="md" fontWeight="bold" as="h3">
              {t('ItemPage.until')}
            </Tag>
            <Flex flexFlow={'column'} flex="1" alignItems={'flex-end'} gap={1}>
              <Text fontSize="xs" textAlign={'right'}>
                {format.dateTime(endDate, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </Flex>
          </HStack>
        )}
      </Flex>
    </CardBase>
  );
};

export default NcMallCard;

export const getNCMallDataDates = (ncMallData: NCMallData, item: ItemData) => {
  const startDate = ncMallData.saleBegin
    ? maxDate(new UTCDate(ncMallData.saleBegin), new UTCDate(item.firstSeen ?? 0))
    : null;

  const endDate = !ncMallData.active
    ? minDate(new UTCDate(ncMallData.saleEnd ?? 0), new UTCDate(ncMallData.updatedAt))
    : ncMallData.saleEnd
      ? new UTCDate(ncMallData.saleEnd)
      : null;

  const discountBegin = ncMallData.discountBegin
    ? maxDate(startDate ?? new UTCDate(0), new UTCDate(ncMallData.discountBegin ?? 0))
    : null;

  const discountEnd = ncMallData.discountEnd
    ? minDate(endDate ?? new UTCDate(9999, 11, 31), new UTCDate(ncMallData.discountEnd ?? 0))
    : null;

  return {
    startDate: startDate?.getTime() ?? null,
    endDate: endDate?.getTime() ?? null,
    discountBegin: discountBegin?.getTime() ?? null,
    discountEnd: discountEnd?.getTime() ?? null,
  };
};

export const isMallDiscounted = (ncMallData?: ItemMallData | null): boolean => {
  if (!ncMallData) return false;
  return !!ncMallData.discountPrice && new Date(ncMallData.discountEnd ?? 0) > new Date();
};

function maxDate(...dates: Date[]): Date {
  return new UTCDate(Math.max(...dates.map((d) => d.getTime())));
}

function minDate(...dates: Date[]): Date {
  return new UTCDate(Math.min(...dates.map((d) => d.getTime())));
}

export const getNCMallLink = (item: ItemData) => {
  const name = encodeURI(item.name.split(' ').join('+').toLowerCase());

  return `https://ncmall.neopets.com/mall/search.phtml?type=search&text=${name}&utm_source=itemdb.com.br`;
};
