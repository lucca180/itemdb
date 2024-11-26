import { Flex, Text } from '@chakra-ui/react';
import React from 'react';
import { ItemData } from '../../types';
import CardBase from '../Card/CardBase';
import ItemCard from './ItemCard';
import { useTranslations } from 'next-intl';

type Props = {
  item: ItemData;
  similarItems: ItemData[];
};

const SimilarItemsCard = (props: Props) => {
  const t = useTranslations();
  const { item } = props;
  const color = item.color.rgb;

  return (
    <CardBase title={t('ItemPage.suggestion')} color={color}>
      <Flex gap={3} wrap="wrap" justifyContent="center">
        {props.similarItems.map((item) => (
          <ItemCard
            utm_content="similar_items"
            disablePrefetch
            key={item.internal_id}
            item={item}
          />
        ))}
        {props.similarItems.length === 0 && (
          <Text fontSize="sm">{t('ItemPage.suggestion-fail')}</Text>
        )}
      </Flex>
    </CardBase>
  );
};

export default SimilarItemsCard;
