import { Flex, Text } from '@chakra-ui/react';
import React from 'react';
import { ItemData } from '../../types';
import CardBase from '../Card/CardBase';
import ItemCard from './ItemCard';
import { useTranslations } from 'next-intl';
import { DyeworksData } from '../../pages/api/v1/items/[id_name]/dyeworks';

type Props = {
  item: ItemData;
  dyeData: DyeworksData;
};

const DyeCard = (props: Props) => {
  const t = useTranslations();
  const { item, dyeData } = props;
  const color = item.color.rgb;

  return (
    <CardBase title={`Dyeworks Info`} color={color}>
      <Flex
        gap={3}
        wrap="wrap"
        fontSize={'sm'}
        textAlign={'center'}
        alignItems="center"
        flexFlow={'column'}
        justifyContent={'center'}
      >
        <Text>
          {item.internal_id === dyeData.originalItem.internal_id &&
            t.rich('ItemPage.dyeworks-x-variations', {
              x: dyeData.dyes.length,
              b: (c) => <b>{c}</b>,
            })}
          {item.internal_id !== dyeData.originalItem.internal_id &&
            t.rich('ItemPage.dyeworks-is-variation', {
              b: (c) => <b>{c}</b>,
            })}
        </Text>
        <Flex wrap="wrap" gap={2} justifyContent={'center'}>
          <Flex
            direction="column"
            gap={2}
            justifyContent="center"
            bg="blackAlpha.500"
            p={3}
            borderRadius={'md'}
          >
            <Text>{t('ItemPage.dyeworks-original-item')}</Text>
            <Flex wrap="wrap" gap={2} justifyContent={'center'}>
              <ItemCard key={dyeData.originalItem.internal_id} item={dyeData.originalItem} small />
            </Flex>
          </Flex>
          <Flex
            direction="column"
            justifyContent="center"
            gap={2}
            bg="blackAlpha.500"
            p={3}
            borderRadius={'md'}
          >
            <Text>{t('ItemPage.dyeworks-all-variants')}</Text>
            <Flex wrap="wrap" gap={2} justifyContent={'center'}>
              {dyeData.dyes.map((dye) => (
                <ItemCard key={dye.internal_id} item={dye} small />
              ))}
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </CardBase>
  );
};

export default DyeCard;
