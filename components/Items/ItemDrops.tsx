/* eslint-disable react/no-unescaped-entities */
import { Flex, Text, Image, Badge, Center, Alert, AlertIcon, Link } from '@chakra-ui/react';
import axios from 'axios';
import React, { useEffect } from 'react';
import { ItemData, ItemOpenable, PrizePoolData } from '../../types';
import CardBase from '../Card/CardBase';
import ItemCard from './ItemCard';
import NextLink from 'next/link';

type Props = {
  item: ItemData;
  itemOpenable: ItemOpenable;
};

const SKIP_ITEMS = [61696];

const ItemDrops = (props: Props) => {
  const [isLoading, setLoading] = React.useState(true);
  const [dropData, setDropData] = React.useState<ItemData[]>([]);
  const { item, itemOpenable } = props;

  const color = item.color.rgb;
  const pools = itemOpenable.pools;
  const itemDrops = itemOpenable.drops;
  const multiplePools = Object.keys(pools).length > 1;
  const isChoice = itemOpenable.isChoice;

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
      <CardBase title="Item Drops" color={color}>
        <Flex gap={3} wrap="wrap" justifyContent="center">
          {Object.values(itemDrops).map((item) => (
            <ItemCard key={item.item_iid} isLoading small />
          ))}
        </Flex>
      </CardBase>
    );

  return (
    <CardBase title="Item Drops" color={color}>
      {itemOpenable.isGBC && (
        <Alert borderRadius={5} mb={3}>
          <AlertIcon />
          <Text fontSize="sm">
            <b>Gift Box Mystery Capsules</b> can drop any item <b>currently</b> for sale at the NC
            Mall for <b>at least 150NC</b>
          </Text>
        </Alert>
      )}

      {isChoice && (itemOpenable.minDrop > 1 || itemOpenable.maxDrop > 1) && (
        <Text textAlign={'center'} mb={3} fontSize="sm" color="gray.200">
          {getDropText(null, itemOpenable)}
        </Text>
      )}
      {pools['le'] && pools['le'].items.length > 0 && (
        <>
          <Alert status="success" variant="subtle" textAlign={'center'}>
            <Text textAlign={'center'} fontSize="sm" flex="1">
              {getDropText(pools['le'], itemOpenable)}
            </Text>
          </Alert>
          <Flex gap={3} wrap="wrap" justifyContent="center" my={3}>
            {pools['le'].items
              .map((a) => itemDrops[a])
              .sort((a, b) => b.dropRate - a.dropRate)
              .map((drop) => {
                const item = dropData.find((a) => drop.item_iid === a.internal_id);
                if (!item) return null;
                return (
                  <ItemCard
                    key={item.internal_id}
                    item={item}
                    small
                    odds={drop.dropRate}
                    isLE={drop.isLE}
                  />
                );
              })}
          </Flex>
        </>
      )}
      {Object.values(pools)
        .filter((a) => !['le', 'unknown'].includes(a.name))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((pool, i) => (
          <Flex alignItems="center" key={pool.name} flexFlow="column" mb={8}>
            {getCatImage(pool.name) && (
              <Image
                h={'60px'}
                w={'269px'}
                objectFit="cover"
                src={getCatImage(pool.name)}
                alt={`${pool} image`}
                mb={3}
              />
            )}
            {!isChoice && pool.name === 'bonus' && (
              <Alert status="success" variant="subtle" textAlign={'center'} mb={3}>
                <Text textAlign={'center'} fontSize="sm" flex="1">
                  {getDropText(pool, itemOpenable)}
                </Text>
              </Alert>
            )}
            {!isChoice && pool.name !== 'bonus' && (
              <Text textAlign={'center'} fontSize="sm" flex="1" mb={3}>
                {getDropText(pool, itemOpenable, i === 0)}
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
                      disablePrefetch={pool.items.length > 10}
                      small
                      odds={drop.dropRate}
                      isLE={drop.isLE}
                    />
                  );
                })}
            </Flex>
            {isChoice && (
              <Text textAlign={'center'} mt={4} fontSize="xs" color="gray.300">
                Odds on {pool.openings} opening reports.{' '}
                <Link as={NextLink} href="/contribute" color="gray.400">
                  Learn How To Help
                </Link>
              </Text>
            )}
          </Flex>
        ))}

      {pools['unknown'] && (
        <>
          {multiplePools && isChoice && (
            <>
              {' '}
              <Center>
                <Badge fontSize="md">Unknown Categories</Badge>
              </Center>
              <Text textAlign={'center'} my={3} fontSize="xs" color="gray.300">
                We couldn't precise the category of the following items, so we cannot provide the
                odds correctly.
              </Text>
            </>
          )}
          {!isChoice &&
            (pools['unknown'].minDrop > 0 || pools['unknown'].maxDrop > 1 || multiplePools) && (
              <Text textAlign={'center'} mb={3} fontSize="sm" color="gray.200">
                {getDropText(pools['unknown'], itemOpenable, !multiplePools)}
              </Text>
            )}
          <Flex gap={3} wrap="wrap" justifyContent="center">
            {pools['unknown'].items
              .map((a) => itemDrops[a])
              .sort((a, b) => b.dropRate - a.dropRate)
              .map((drop) => {
                const item = dropData.find((a) => drop.item_iid === a.internal_id);
                if (!item) return null;
                return (
                  <ItemCard
                    key={item.internal_id}
                    disablePrefetch={pools['unknown'].items.length > 10}
                    item={item}
                    small
                    odds={multiplePools && isChoice ? undefined : drop.dropRate ?? undefined}
                    isLE={drop.isLE}
                  />
                );
              })}
          </Flex>
        </>
      )}
      {!isChoice && !!itemOpenable.openings && (
        <Text textAlign={'center'} mt={4} fontSize="xs" color="gray.300">
          {item.name} drop odds on {itemOpenable.openings} opening reports.{' '}
          <Link as={NextLink} href="/contribute" color="gray.400">
            Learn How To Help
          </Link>
        </Text>
      )}
    </CardBase>
  );
};

export default ItemDrops;

const getCatImage = (cat: string) => {
  if (cat === 'trinkets') return `https://images.neopets.com/ncmall/buttons/bg_${cat}.png`;
  else if (['accessories', 'clothing'].includes(cat))
    return `https://images.neopets.com/ncmall/buttons/${cat}.png`;

  if (cat.match(/cat\d+y\d+/gim)) {
    const [catId, catY] = cat.toLowerCase().split('y');
    return `https://images.neopets.com/ncmall/buttons/altador_years_${catId}_y${catY}.png`;
  }

  return '';
};

const getDropText = (pool: PrizePoolData | null, itemOpenable: ItemOpenable, isFirst?: boolean) => {
  let text = <></>;

  if (!pool)
    return (
      <>
        This item will drop {itemOpenable.minDrop === 1 && itemOpenable.maxDrop === 1 && <b>one</b>}
        {itemOpenable.minDrop >= 1 && itemOpenable.maxDrop > 1 && (
          <b>at least {itemOpenable.minDrop}</b>
        )}
        {itemOpenable.minDrop >= 1 && itemOpenable.maxDrop !== itemOpenable.minDrop && ' and '}
        {itemOpenable.maxDrop > 1 && itemOpenable.maxDrop !== itemOpenable.minDrop && (
          <b>up to {itemOpenable.maxDrop}</b>
        )}{' '}
        of these items:
      </>
    );

  if (pool.isChance) {
    text = (
      <>
        You have a{' '}
        {pool.openings > 0 && <b>{((pool.openings / itemOpenable.openings) * 100).toFixed(2)}%</b>}{' '}
        chance of getting {pool.minDrop === 1 && pool.maxDrop === 1 && <b>one</b>}
        {pool.minDrop >= 1 && pool.maxDrop > 1 && <b>at least {pool.minDrop}</b>}
        {pool.minDrop >= 1 && pool.maxDrop !== pool.minDrop && ' and '}
        {pool.maxDrop > 1 && pool.maxDrop !== pool.minDrop && <b>up to {pool.maxDrop}</b>} of these{' '}
        {pool.name === 'bonus' ? <b>bonus</b> : pool.name === 'le' ? <b>Limited Edition</b> : ''}{' '}
        items:
      </>
    );
  }

  if (!pool.isChance) {
    text = (
      <>
        This item will {!isFirst ? 'also ' : ''} drop{' '}
        {pool.minDrop === 1 && pool.maxDrop === 1 && <b>one</b>}
        {pool.minDrop >= 1 && pool.maxDrop > 1 && pool.maxDrop !== pool.minDrop && (
          <b>at least {pool.minDrop}</b>
        )}
        {pool.minDrop >= 1 && pool.maxDrop > 1 && pool.maxDrop === pool.minDrop && (
          <b>exactly {pool.minDrop}</b>
        )}
        {pool.minDrop >= 1 && pool.maxDrop !== pool.minDrop && ' and '}
        {pool.maxDrop > 1 && pool.maxDrop !== pool.minDrop && <b>up to {pool.maxDrop}</b>} of the
        following items:
      </>
    );
  }

  return text;
};
