import { Button, Flex, useBoolean } from '@chakra-ui/react';
import axios from 'axios';
import React, { useEffect } from 'react';
import { ItemData } from '../../types';
import CardBase from '../Card/CardBase';
import ItemCard from './ItemCard';
import { useTranslations } from 'next-intl';

type Props = {
  item: ItemData;
  parent: {
    parents_iid: number[];
    itemData: ItemData[];
  };
};

const ItemParent = (props: Props) => {
  const t = useTranslations();
  const [parentData, setParentData] = React.useState<ItemData[]>(props.parent.itemData);
  const { item } = props;
  const { parents_iid: parentItems } = props.parent;
  const color = item.color.rgb;
  const [showMore, { toggle }] = useBoolean(false);

  useEffect(() => {
    init();
  }, [parentItems]);

  const init = async () => {
    if (parentItems.length === parentData.length) return;
    const itemRes = await axios.post(`/api/v1/items/many`, {
      id: parentItems,
    });

    setParentData(Object.values(itemRes.data));
  };

  return (
    <CardBase title={t('ItemPage.found-inside')} color={color}>
      <Flex gap={3} wrap="wrap" justifyContent="center">
        {parentData
          .sort((a, b) => (b.item_id ?? b.internal_id) - (a.item_id ?? a.internal_id))
          .slice(0, showMore ? parentData.length : 4)
          .map((item) => {
            return <ItemCard key={item.internal_id} item={item} small utm_content="found-inside" />;
          })}
      </Flex>
      {parentItems.length > 4 && (
        <Flex justifyContent="center" mt={3}>
          <Button size={'sm'} onClick={toggle}>
            {!showMore ? t('ItemPage.show-more') : t('ItemPage.show-less')}
          </Button>
        </Flex>
      )}
    </CardBase>
  );
};

export default ItemParent;
