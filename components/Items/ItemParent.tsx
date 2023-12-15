import { Flex } from '@chakra-ui/react';
import axios from 'axios';
import React, { useEffect } from 'react';
import { ItemData } from '../../types';
import CardBase from '../Card/CardBase';
import ItemCard from './ItemCard';

type Props = {
  item: ItemData;
  parentItems: number[];
};

const ItemParent = (props: Props) => {
  const [isLoading, setLoading] = React.useState(true);
  const [parentData, setParentData] = React.useState<ItemData[]>([]);
  const { item, parentItems } = props;
  const color = item.color.rgb;

  useEffect(() => {
    setLoading(true);
    init();
  }, [parentItems]);

  const init = async () => {
    const itemRes = await axios.post(`/api/v1/items/many`, {
      id: parentItems,
    });

    setParentData(Object.values(itemRes.data));
    setLoading(false);
  };

  if (isLoading)
    return (
      <CardBase title="Found Inside" color={color}>
        <Flex gap={3} wrap="wrap" justifyContent="center">
          {parentItems.map((id) => (
            <ItemCard key={id} isLoading small />
          ))}
        </Flex>
      </CardBase>
    );

  return (
    <CardBase title="Found Inside" color={color}>
      <Flex gap={3} wrap="wrap" justifyContent="center">
        {parentData.map((item) => {
          return <ItemCard key={item.internal_id} item={item} small />;
        })}
      </Flex>
    </CardBase>
  );
};

export default ItemParent;
