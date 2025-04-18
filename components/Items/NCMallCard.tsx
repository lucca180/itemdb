import { Center, Flex, HStack, Tag, Text, Link, Badge } from '@chakra-ui/react';
import React from 'react';
import { ItemData, NCMallData } from '../../types';
import CardBase from '../Card/CardBase';
import Image from 'next/image';
import { useFormatter, useTranslations } from 'next-intl';

type Props = {
  item: ItemData;
  ncMallData: NCMallData;
};

const NcMallCard = (props: Props) => {
  const t = useTranslations();
  const format = useFormatter();
  const { item, ncMallData } = props;

  const isDiscounted =
    ncMallData.active &&
    !!ncMallData.discountPrice &&
    new Date(ncMallData.discountEnd ?? 0) > new Date();
  const isBuyable =
    ncMallData.active && (!ncMallData.saleEnd || new Date(ncMallData.saleEnd) > new Date());

  return (
    <CardBase title={t('ItemPage.nc-mall-info')} color={item.color.rgb}>
      <Flex flexFlow={'column'} gap={2}>
        <Center flexFlow="column" gap={2}>
          <Link href={`https://ncmall.neopets.com/`} isExternal>
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
            <Badge fontSize="xs" colorScheme={'purple'}>
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
        {ncMallData.saleBegin && (
          <HStack>
            <Tag size="md" fontWeight="bold" as="h3">
              {t('ItemPage.since')}
            </Tag>
            <Flex flexFlow={'column'} flex="1" alignItems={'flex-end'} gap={1}>
              <Text fontSize="xs" textAlign={'right'}>
                {format.dateTime(new Date(ncMallData.saleBegin), {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </Flex>
          </HStack>
        )}
        {ncMallData.saleEnd && (
          <HStack>
            <Tag size="md" fontWeight="bold" as="h3">
              {t('ItemPage.until')}
            </Tag>
            <Flex flexFlow={'column'} flex="1" alignItems={'flex-end'} gap={1}>
              <Text fontSize="xs" textAlign={'right'}>
                {format.dateTime(new Date(ncMallData.saleEnd ?? 0), {
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
