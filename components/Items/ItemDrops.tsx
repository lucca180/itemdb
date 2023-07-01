import { Flex, Text } from '@chakra-ui/react';
import axios from 'axios';
import React, { useEffect } from 'react';
import { ItemData, ItemDrop } from '../../types';
import CardBase from '../Card/CardBase';
import ItemCard from './ItemCard';

type Props = {
  item: ItemData;
  itemDrops: ItemDrop[];
};

const ItemDrops = (props: Props) => {
  const [isLoading, setLoading] = React.useState(true);
  const [dropData, setDropData] = React.useState<ItemData[]>([]);
  const { item, itemDrops } = props;
  const color = item.color.rgb;

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
};

export default ItemDrops;
