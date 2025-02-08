/* eslint-disable react/no-unescaped-entities */
import { Flex, Text, Image, Badge, Center, Alert, AlertIcon, Link } from '@chakra-ui/react';
import axios from 'axios';
import React, { useEffect, useMemo } from 'react';
import { ItemData, ItemOpenable, PrizePoolData } from '../../types';
import CardBase from '../Card/CardBase';
import ItemCard from './ItemCard';
import NextLink from 'next/link';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';

const OldPoolDrops = dynamic(() => import('../Utils/OldPoolDrops'));

type Props = {
  item: ItemData;
  itemOpenable: ItemOpenable;
};

const SKIP_ITEMS = [61696, 65743];

const ItemDrops = (props: Props) => {
  const t = useTranslations();
  const [isLoading, setLoading] = React.useState(true);
  const [dropData, setDropData] = React.useState<ItemData[]>([]);
  const { item, itemOpenable } = props;

  const color = item.color.rgb;
  const pools = itemOpenable.pools;
  const itemDrops = itemOpenable.drops;
  const multiplePools = Object.keys(pools).filter((a) => !a.includes('old-')).length > 1;
  const isChoice = itemOpenable.isChoice;

  const hasOldPool = Object.keys(pools).some((a) => a.includes('old-'));

  const poolsArr = useMemo(
    () => Object.values(pools).sort((a, b) => (a.isLE ? -1 : a.name.localeCompare(b.name))),
    [pools]
  );

  useEffect(() => {
    if (SKIP_ITEMS.includes(item.internal_id)) return;

    init();
  }, [item.internal_id]);

  const init = async () => {
    const itemRes = await axios.post(`/api/v1/items/many`, {
      id: Object.keys(itemDrops),
    });

    setDropData(Object.values(itemRes.data));
    setLoading(false);
  };

  if (SKIP_ITEMS.includes(item.internal_id)) return null;

  if (isLoading)
    return (
      <CardBase title={t('Drops.item-drops')} color={color}>
        <Flex gap={3} wrap="wrap" justifyContent="center">
          {Object.values(itemDrops).map((item) => (
            <ItemCard key={item.item_iid} isLoading small />
          ))}
        </Flex>
      </CardBase>
    );

  return (
    <CardBase title={t('Drops.item-drops')} color={color}>
      {itemOpenable.isGBC && (
        <Alert borderRadius={5} mb={3}>
          <AlertIcon />
          <Text fontSize="sm">{t.rich('Drops.gbc', { b: (text) => <b>{text}</b> })}</Text>
        </Alert>
      )}

      {isChoice && (itemOpenable.minDrop > 1 || itemOpenable.maxDrop > 1) && (
        <Text textAlign={'center'} mb={3} fontSize="sm" color="gray.200">
          <DropText pool={null} itemOpenable={itemOpenable} />
        </Text>
      )}

      {poolsArr
        .filter((a) => !['unknown'].includes(a.name) && !a.name.includes('old-'))
        .map((pool, i) => (
          <DropPool
            key={pool.name}
            pool={pool}
            itemOpenable={itemOpenable}
            item={item}
            dropData={dropData}
            isFirst={i === 0}
            forceOddsText={hasOldPool}
          />
        ))}

      {pools['unknown'] && (
        <DropPool
          pool={pools['unknown']}
          itemOpenable={itemOpenable}
          item={item}
          dropData={dropData}
          hasMultiplePools={multiplePools}
          isFirst={!multiplePools}
          forceOddsText={hasOldPool}
        />
      )}

      {hasOldPool && (
        <OldPoolDrops
          pools={poolsArr.filter((a) => a.name.includes('old-'))}
          itemOpenable={itemOpenable}
          item={item}
          dropData={dropData}
        />
      )}

      {!isChoice && !!itemOpenable.openings && !hasOldPool && (
        <Text textAlign={'center'} mt={4} fontSize="xs" color="gray.300">
          {t.rich('Drops.item-opening-reports', {
            openings: itemOpenable.openings,
            itemName: item.name,
            Link: (text) => (
              <Link as={NextLink} href="/contribute" color="gray.400">
                {text}
              </Link>
            ),
          })}
        </Text>
      )}
    </CardBase>
  );
};

export default ItemDrops;

type CatImageProps = {
  cat: string;
  item_iid: number;
};

const CatImage = (props: CatImageProps) => {
  const { cat, item_iid } = props;
  const t = useTranslations();

  let url = '';

  if (cat === 'trinkets') url = `https://images.neopets.com/ncmall/buttons/bg_${cat}.png`;
  else if (['accessories', 'clothing'].includes(cat))
    url = `https://images.neopets.com/ncmall/buttons/${cat}.png`;

  if (cat.match(/cat\d+y\d+/gim)) {
    const [catId, catY] = cat.toLowerCase().split('y');
    url = `https://images.neopets.com/ncmall/buttons/altador_years_${catId}_y${catY}.png`;
  }

  if (url)
    return <Image h={'60px'} w={'269px'} objectFit="cover" src={url} alt={`${cat} image`} mb={3} />;

  // figure out a better way to handle this
  if (item_iid === 63977) {
    if (cat.toLowerCase() === 'cat1') url = '2007-2010';

    if (cat.toLowerCase() === 'cat2') url = '2011-2012';

    if (cat.toLowerCase() === 'cat3') url = '2013-2014';
  }

  if (cat === 'unknown')
    return (
      <>
        <Center>
          <Badge fontSize="md">{t('Drops.unknown-categories')}</Badge>
        </Center>
        <Text textAlign={'center'} my={3} fontSize="xs" color="gray.300">
          {t('Drops.unknown-text')}
        </Text>
      </>
    );

  if (url)
    return (
      <Badge as="h3" fontSize="lg" mb={3}>
        {url}
      </Badge>
    );

  return (
    <Badge as="h3" fontSize="md" mb={3}>
      Category {cat}
    </Badge>
  );
};

type DropTextProps = {
  pool: PrizePoolData | null;
  itemOpenable: ItemOpenable;
  isFirst?: boolean;
};

const DropText = ({ pool, itemOpenable, isFirst }: DropTextProps) => {
  const t = useTranslations();
  const isGram = itemOpenable.isGram;

  if (!pool || !pool.isChance || (isGram && !pool.isLE)) {
    const openable = pool ?? itemOpenable;
    const poolName = pool ? (pool.isLE ? 'le' : pool.name) : 'unknown';

    if (openable.maxDrop > 1 && openable.maxDrop !== openable.minDrop)
      return (
        <>
          {t.rich(isGram ? 'Drops.gram-multiple' : 'Drops.multiple', {
            b: (text) => <b>{text}</b>,
            isFirst: isFirst,
            type: poolName,
            min: openable.minDrop,
            max: openable.maxDrop,
          })}
        </>
      );

    return (
      <>
        {t.rich(isGram ? 'Drops.gram-single' : 'Drops.single', {
          b: (text) => <b>{text}</b>,
          isFirst: isFirst,
          type: poolName,
          min: openable.minDrop || openable.maxDrop,
        })}
      </>
    );
  }

  if (pool.isChance && (!isGram || pool.isLE)) {
    if (pool.maxDrop > 1 && pool.maxDrop !== pool.minDrop)
      return (
        <>
          {t.rich('Drops.chance-multiple', {
            b: (text) => <b>{text}</b>,
            isFirst: isFirst,
            min: pool.minDrop,
            max: pool.maxDrop,
            type: pool.isLE ? 'le' : pool.name,
            isGram: isGram,
            chance: pool.openings ? ((pool.openings / itemOpenable.openings) * 100).toFixed(2) : 0,
          })}
        </>
      );

    return (
      <>
        {t.rich('Drops.chance-single', {
          b: (text) => <b>{text}</b>,
          isFirst: isFirst,
          min: pool.minDrop || pool.maxDrop,
          type: pool.isLE ? 'le' : pool.name,
          isGram: isGram,
          chance: pool.openings ? ((pool.openings / itemOpenable.openings) * 100).toFixed(2) : 0,
        })}
      </>
    );
  }

  return null;
};

type DropPoolProps = {
  pool: PrizePoolData;
  itemOpenable: ItemOpenable;
  item: ItemData;
  dropData: ItemData[];
  isFirst?: boolean;
  forceOddsText?: boolean;
  hasMultiplePools?: boolean;
};

export const DropPool = (props: DropPoolProps) => {
  const { pool, itemOpenable, item, dropData, isFirst, forceOddsText } = props;
  const isChoice = itemOpenable.isChoice;
  const itemDrops = itemOpenable.drops;
  const t = useTranslations();
  console.log(pool.name, isFirst, forceOddsText);
  return (
    <Flex alignItems="center" key={pool.name} flexFlow="column" mb={3}>
      {isChoice && !pool.isLE && <CatImage cat={pool.name} item_iid={item.internal_id} />}
      {(pool.name === 'bonus' || pool.isLE) && (
        <Alert status="success" variant="subtle" textAlign={'center'} mb={3}>
          <Text textAlign={'center'} fontSize="sm" flex="1">
            <DropText pool={pool} itemOpenable={itemOpenable} />
          </Text>
        </Alert>
      )}
      {!isChoice && pool.name !== 'bonus' && !pool.isLE && (
        <Text textAlign={'center'} fontSize="sm" flex="1" mb={3}>
          <DropText pool={pool} itemOpenable={itemOpenable} isFirst={isFirst} />
        </Text>
      )}
      <Flex gap={3} wrap="wrap" justifyContent="center">
        {pool.items
          .map((a) => itemDrops[a])
          .sort((a, b) => b.dropRate - a.dropRate)
          .map((drop) => {
            const item = dropData.find((a) => drop.item_iid === a.internal_id);
            if (!item) return null;
            return (
              <ItemCard
                key={item.internal_id}
                item={item}
                disablePrefetch
                small
                odds={drop.dropRate}
                isLE={drop.isLE}
              />
            );
          })}
      </Flex>
      {((isChoice && !pool.isLE) || forceOddsText) && (
        <Text textAlign={'center'} mt={4} fontSize="xs" color="gray.300">
          {t.rich('Drops.pool-opening-reports', {
            b: (text) => <b>{text}</b>,
            openings: pool.openings,
            Link: (text) => (
              <Link as={NextLink} href="/contribute" color="gray.400">
                {text}
              </Link>
            ),
          })}
        </Text>
      )}
    </Flex>
  );
};
