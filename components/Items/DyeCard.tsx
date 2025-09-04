import { Flex, Text } from '@chakra-ui/react';
import React, { useMemo } from 'react';
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

  const type = useMemo(() => {
    if (dyeData.originalItem.name.toLowerCase().includes('dyeworks')) return 'dyeworks';
    if (dyeData.originalItem.name.toLowerCase().includes('prismatic')) return 'prismatic';

    if (dyeData.dyes.some((dye) => dye.name.toLowerCase().includes('dyeworks'))) return 'dyeworks';
    if (dyeData.dyes.some((dye) => dye.name.toLowerCase().includes('prismatic')))
      return 'prismatic';
    return 'none';
  }, [dyeData]);

  return (
    <CardBase title={type === 'dyeworks' ? `Dyeworks Info` : 'Prismatic Info'} color={color}>
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
            t.rich(`DyeCard.${type}-x-variations`, {
              x: dyeData.dyes.length,
              b: (c) => <b>{c}</b>,
            })}
          {item.internal_id !== dyeData.originalItem.internal_id &&
            t.rich(`DyeCard.${type}-is-variation`, {
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
            <Text>{t('DyeCard.dyeworks-original-item')}</Text>
            <Flex wrap="wrap" gap={2} justifyContent={'center'}>
              <ItemCard
                uniqueID="dyeworks-original-item"
                key={dyeData.originalItem.internal_id}
                item={dyeData.originalItem}
                small
              />
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
            <Text>{t('DyeCard.dyeworks-all-variants')}</Text>
            <Flex wrap="wrap" gap={2} justifyContent={'center'}>
              {dyeData.dyes.map((dye) => (
                <ItemCard uniqueID="dyeworks-variant" key={dye.internal_id} item={dye} small />
              ))}
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </CardBase>
  );
};

export default DyeCard;
