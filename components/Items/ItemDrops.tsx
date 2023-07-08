/* eslint-disable react/no-unescaped-entities */
import { Flex, Text, Image, Badge, Center } from '@chakra-ui/react';
import axios from 'axios';
import React, { useEffect } from 'react';
import { ItemData, ItemDrop } from '../../types';
import CardBase from '../Card/CardBase';
import ItemCard from './ItemCard';

type Props = {
  item: ItemData;
  itemDrops: ItemDrop[];
};

const catType = ['trinkets', 'accessories', 'clothing'];

const ItemDrops = (props: Props) => {
  const [isLoading, setLoading] = React.useState(true);
  const [dropData, setDropData] = React.useState<ItemData[]>([]);
  const { item, itemDrops } = props;
  const color = item.color.rgb;
  const isCat = itemDrops[0].isCategoryCap;

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
          Odds on {itemDrops[0].openings} openings reports
        </Text>
      </CardBase>
    );

  return (
    <CardBase title="This item can drop" color={color}>
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
      {catType.map((cat) => (
        <Flex alignItems="center" key={cat} flexFlow="column" my={8}>
          <Image
            h={'60px'}
            w={'269px'}
            objectFit="cover"
            src={
              cat != 'trinkets'
                ? `https://images.neopets.com/ncmall/buttons/${cat}.png`
                : `https://images.neopets.com/ncmall/buttons/bg_${cat}.png`
            }
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
      <Text textAlign={'center'} mt={3} fontSize="xs" color="gray.300">
        Data on {itemDrops[0].openings} openings reports
      </Text>
    </CardBase>
  );
};

export default ItemDrops;