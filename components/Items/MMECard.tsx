import { Flex, Text } from '@chakra-ui/react';
import React from 'react';
import { ItemData, ItemMMEData } from '../../types';
import CardBase from '../Card/CardBase';
import ItemCard from './ItemCard';
import { useTranslations } from 'next-intl';

type Props = {
  item: ItemData;
  mmeData: ItemMMEData;
};

const MMECard = (props: Props) => {
  const t = useTranslations();
  const { item, mmeData } = props;
  const color = item.color.rgb;

  return (
    <CardBase title={`${mmeData.name} Info`} color={color}>
      <Flex gap={3} wrap="wrap" alignItems="center" flexFlow={'column'}>
        <Text fontSize={'sm'} textAlign={'center'}>
          {t.rich('ItemPage.mme-text', {
            b: (children) => <b>{children}</b>,
            name: mmeData.name,
            isMini: mmeData.isMini,
          })}
        </Text>
        <Flex wrap="wrap" gap={2} alignItems="center" justifyContent={'center'}>
          {Object.keys(mmeData.trails).map((trail) => (
            <Flex
              key={trail}
              direction="column"
              gap={2}
              bg="blackAlpha.500"
              p={3}
              borderRadius={'md'}
            >
              <Text>
                <b>
                  {t('ItemPage.mme-trail', {
                    x: trail.toUpperCase(),
                  })}
                </b>
              </Text>
              <Flex wrap="wrap" gap={2} justifyContent={'center'}>
                <ItemCard item={mmeData.initial} small />
                {mmeData.trails[trail].map((i) => (
                  <ItemCard key={i.internal_id} item={i} small />
                ))}
              </Flex>
            </Flex>
          ))}
        </Flex>
        <Text fontSize={'sm'} textAlign={'center'}>
          {t.rich('ItemPage.mme-chance', {
            b: (children) => <b>{children}</b>,
          })}
        </Text>
        <ItemCard item={mmeData.bonus} small isLE />
      </Flex>
    </CardBase>
  );
};

export default MMECard;
