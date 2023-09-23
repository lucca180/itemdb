/* eslint-disable react/no-unescaped-entities */
import { Flex, Text, Image, Badge, Center, Alert, AlertIcon, Link } from '@chakra-ui/react';
import axios from 'axios';
import React, { useEffect } from 'react';
import { ItemData, ItemOpenable } from '../../types';
import CardBase from '../Card/CardBase';
import ItemCard from './ItemCard';
import NextLink from 'next/link';

type Props = {
  item: ItemData;
  itemOpenable: ItemOpenable;
};

const ItemDrops = (props: Props) => {
  const [isLoading, setLoading] = React.useState(true);
  const [dropData, setDropData] = React.useState<ItemData[]>([]);
  const { item, itemOpenable } = props;

  const color = item.color.rgb;
  const isCat = itemOpenable.isCategoryCap;
  const itemDrops = itemOpenable.drops;

  const allCats = new Set(
    itemOpenable.isCategoryCap ? itemDrops.filter((a) => a.notes).map((a) => a.notes) : []
  ) as Set<string>;

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const itemRes = await axios.post(`/api/v1/items/many`, {
      id: itemDrops.map((a) => a.item_iid),
    });

    setDropData(Object.values(itemRes.data));
    setLoading(false);
  };

  if (isLoading)
    return (
      <CardBase title="This item can drop" color={color}>
        <Flex gap={3} wrap="wrap" justifyContent="center">
          {itemDrops.map((item) => (
            <ItemCard key={item.item_iid} isLoading small />
          ))}
        </Flex>
      </CardBase>
    );

  if (!isCat)
    return (
      <CardBase title="This item can drop" color={color}>
        {itemOpenable.isGBC && (
          <Alert borderRadius={5} mb={3}>
            <AlertIcon />
            <Text fontSize="sm">
              <b>Gift Box Mystery Capsules</b> can drop any item <b>currently</b> for sale at the NC
              Mall for <b>at least 150NC</b>
            </Text>
          </Alert>
        )}
        {(itemOpenable.minDrop > 1 || itemOpenable.maxDrop > 1) && (
          <Text textAlign={'center'} mb={3} fontSize="sm" color="gray.200">
            This item will drop{' '}
            {itemOpenable.minDrop > 1 && <b>at least {itemOpenable.minDrop} items</b>}
            {itemOpenable.minDrop > 1 && itemOpenable.maxDrop !== itemOpenable.minDrop && ' and '}
            {itemOpenable.maxDrop > 1 && itemOpenable.maxDrop !== itemOpenable.minDrop && (
              <b>up to {itemOpenable.maxDrop} items</b>
            )}{' '}
            of the following:
          </Text>
        )}
        <Flex gap={3} wrap="wrap" justifyContent="center">
          {itemDrops
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
        <Text textAlign={'center'} mt={3} fontSize="xs" color="gray.300">
          Odds on {itemOpenable.openings} openings reports.{' '}
          <Link as={NextLink} href="/contribute" color="gray.400">
            Learn How To Help
          </Link>
        </Text>
      </CardBase>
    );

  return (
    <CardBase title="This item can drop" color={color}>
      {(itemOpenable.minDrop > 1 || itemOpenable.maxDrop > 1) && (
        <Text textAlign={'center'} mb={3} fontSize="sm" color="gray.200">
          This item will drop{' '}
          {itemOpenable.minDrop > 1 && <b>at least {itemOpenable.minDrop} items</b>}
          {itemOpenable.minDrop > 1 && itemOpenable.maxDrop !== itemOpenable.minDrop && ' and '}
          {itemOpenable.maxDrop > 1 && itemOpenable.maxDrop !== itemOpenable.minDrop && (
            <b>up to {itemOpenable.maxDrop} items</b>
          )}{' '}
          of the following:
        </Text>
      )}
      {itemDrops.filter((a) => a.isLE).length > 0 && (
        <>
          <Flex gap={3} wrap="wrap" justifyContent="center" my={3}>
            {itemDrops
              .filter((a) => a.isLE)
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
      {[...allCats.values()]
        .filter((a) => !['LE', 'unknown'].includes(a))
        .sort((a, b) => a.localeCompare(b))
        .map((cat) => (
          <Flex alignItems="center" key={cat} flexFlow="column" mb={8}>
            <Image
              h={'60px'}
              w={'269px'}
              objectFit="cover"
              src={getCatImage(cat)}
              alt={`${cat} image`}
              mb={3}
            />
            <Flex gap={3} wrap="wrap" justifyContent="center">
              {itemDrops
                .filter((a) => a.notes === cat && !a.isLE)
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
          </Flex>
        ))}

      {itemDrops.filter((a) => a.notes === 'unknown').length > 0 && (
        <>
          <Center>
            <Badge fontSize="md">Unknown Categories</Badge>
          </Center>
          <Text textAlign={'center'} my={3} fontSize="xs" color="gray.300">
            We couldn't precise the category of the following items, so we cannot provide the odds
            correctly.
          </Text>
          <Flex gap={3} wrap="wrap" justifyContent="center">
            {itemDrops
              .filter((a) => a.notes === 'unknown')
              .sort((a, b) => b.dropRate - a.dropRate)
              .map((drop) => {
                const item = dropData.find((a) => drop.item_iid === a.internal_id);
                if (!item) return null;
                return (
                  <ItemCard
                    key={item.internal_id}
                    item={item}
                    small
                    // odds={drop.dropRate}
                    isLE={drop.isLE}
                  />
                );
              })}
          </Flex>
        </>
      )}
      <Text textAlign={'center'} mt={4} fontSize="xs" color="gray.300">
        Odds on {itemOpenable.openings} openings reports.{' '}
        <Link as={NextLink} href="/contribute" color="gray.400">
          Learn How To Help
        </Link>
      </Text>
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
