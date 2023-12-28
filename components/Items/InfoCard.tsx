import { Box, Flex, HStack, Tag, Text, Tooltip } from '@chakra-ui/react';
import React from 'react';
import { ItemData } from '../../types';
import { MdHelp } from 'react-icons/md';
import { rarityStr } from '../../utils/utils';
import { useTranslations } from 'next-intl';

type Props = {
  item: ItemData;
};

const intl = new Intl.NumberFormat();

const ItemInfoCard = (props: Props) => {
  const t = useTranslations();
  const { item } = props;
  const color = item.color.rgb;
  const rarityString = rarityStr(item.rarity ?? 0);

  return (
    <Flex
      // flex={1}
      // height='100%'
      borderTopRadius="md"
      overflow="hidden"
      flexFlow="column"
      boxShadow="sm"
    >
      <Box
        p={2}
        textAlign="center"
        fontWeight="bold"
        bg={`rgba(${color[0]}, ${color[1]}, ${color[2]}, .6)`}
      >
        {t('ItemPage.item-info')}
      </Box>
      <Flex
        p={3}
        bg="gray.600"
        boxShadow="md"
        gap={4}
        flexFlow="column"
        // textAlign='center'
        h="100%"
        borderBottomRadius="md"
      >
        <HStack>
          <Tag size="lg" fontWeight="bold" as="h3">
            {t('General.item-id')}
          </Tag>
          <Text flex="1" textAlign="right">
            {item.item_id ?? '???'}
          </Text>
        </HStack>
        <HStack>
          <Tag size="lg" fontWeight="bold" as="h3">
            {t('General.rarity')}
          </Tag>
          <Text flex="1" textAlign="right">
            r{item.rarity ?? '???'}
            {item.rarity && rarityString && (
              <>
                <br />
                <Text as="span" fontWeight="bold" fontSize="sm" color={rarityString.color}>
                  ({rarityString.text})
                </Text>
              </>
            )}
          </Text>
        </HStack>
        <HStack>
          <Tag size="lg" fontWeight="bold" as="h3">
            {t('General.weight')}
          </Tag>
          <Text flex="1" textAlign="right">
            {item.weight ?? '???'} lbs
          </Text>
        </HStack>
        <HStack>
          <Tooltip
            hasArrow
            label={t('ItemPage.est-val-warning')}
            bg="gray.700"
            placement="top"
            color="white"
          >
            <Tag size="lg" fontWeight="bold" as="h3">
              {t('General.est-val')} <MdHelp size={'0.8rem'} style={{ marginLeft: '0.2rem' }} />
            </Tag>
          </Tooltip>

          <Text flex="1" textAlign="right">
            {item.estVal != null ? intl.format(item.estVal) : '???'} NP
          </Text>
        </HStack>
        <HStack>
          <Tag size="lg" fontWeight="bold" as="h3">
            {t('General.category')}
          </Tag>
          <Text flex="1" textAlign="right" textTransform="capitalize">
            {item.category ?? '???'}
          </Text>
        </HStack>
        <HStack>
          <Tag size="lg" fontWeight="bold" as="h3">
            {t('General.status')}
          </Tag>
          <Text flex="1" textAlign="right" textTransform="capitalize">
            {item.status ?? 'Active'}
          </Text>
        </HStack>
        <HStack>
          <Tag size="lg" fontWeight="bold" as="h3">
            {t('General.itemdb-id')}
          </Tag>
          <Text flex="1" textAlign="right" textTransform="capitalize">
            {item.internal_id}
          </Text>
        </HStack>
      </Flex>
    </Flex>
  );
};

export default ItemInfoCard;
