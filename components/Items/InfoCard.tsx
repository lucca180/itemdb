import { Box, Flex, HStack, Link, Tag, Text, Tooltip } from '@chakra-ui/react';
import React from 'react';
import { ItemData } from '../../types';
import { MdHelp } from 'react-icons/md';
import { rarityStr } from '../../utils/utils';
import { useFormatter, useTranslations } from 'next-intl';
import Color from 'color';

type Props = {
  item: ItemData;
};

const ItemInfoCard = (props: Props) => {
  const t = useTranslations();
  const format = useFormatter();
  const { item } = props;
  const color = Color(item.color.hex);
  const rgb = item.color.rgb;
  const rarityString = rarityStr(item.rarity ?? 0);

  return (
    <Flex borderTopRadius="md" overflow="hidden" flexFlow="column" boxShadow="sm">
      <Box
        p={2}
        textAlign="center"
        fontWeight="bold"
        bg={`rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, .6)`}
      >
        {t('ItemPage.item-info')}
      </Box>
      <Flex
        p={3}
        bg="gray.600"
        boxShadow="md"
        gap={4}
        flexFlow="column"
        h="100%"
        borderBottomRadius="md"
      >
        <HStack>
          <Tag.Root size="lg" fontWeight="bold" as="h3">
            <Tag.Label>{t('General.item-id')}</Tag.Label>
          </Tag.Root>
          <Text flex="1" textAlign="right">
            {item.item_id ?? '???'}
          </Text>
        </HStack>
        <HStack>
          <Tag.Root size="lg" fontWeight="bold" as="h3">
            <Tag.Label>{t('General.rarity')}</Tag.Label>
          </Tag.Root>
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
          <Tag.Root size="lg" fontWeight="bold" as="h3">
            <Tag.Label>{t('General.weight')}</Tag.Label>
          </Tag.Root>
          <Text flex="1" textAlign="right">
            {item.weight ?? '???'} lbs
          </Text>
        </HStack>
        <HStack>
          <Tooltip.Root positioning={{ placement: 'top' }}>
            <Tooltip.Trigger asChild>
              <Tag.Root size="lg" fontWeight="bold" as="h3" cursor="default">
                <Tag.Label>
                  {t('General.est-val')} <MdHelp size={'0.8rem'} style={{ marginLeft: '0.2rem' }} />
                </Tag.Label>
              </Tag.Root>
            </Tooltip.Trigger>
            <Tooltip.Positioner>
              <Tooltip.Content bg="gray.700" color="white" fontSize="sm">
                {t('ItemPage.est-val-warning')}
              </Tooltip.Content>
            </Tooltip.Positioner>
          </Tooltip.Root>

          <Text flex="1" textAlign="right">
            {item.estVal != null ? format.number(item.estVal) : '???'} NP
          </Text>
        </HStack>
        <HStack>
          <Tag.Root size="lg" fontWeight="bold" as="h3">
            <Tag.Label>{t('General.category')}</Tag.Label>
          </Tag.Root>
          <Text flex="1" textAlign="right" textTransform="capitalize">
            <Link
              color={color.lightness(70).hex()}
              href={`/search?s=&category[]=${item.category ?? 'Unknown'}`}
            >
              {item.category ?? '???'}
            </Link>
          </Text>
        </HStack>
        <HStack>
          <Tag.Root size="lg" fontWeight="bold" as="h3">
            <Tag.Label>{t('General.status')}</Tag.Label>
          </Tag.Root>
          <Text flex="1" textAlign="right" textTransform="capitalize">
            {item.status ?? 'Active'}
          </Text>
        </HStack>
        <HStack>
          <Tag.Root size="lg" fontWeight="bold" as="h3">
            <Tag.Label>{t('General.itemdb-id')}</Tag.Label>
          </Tag.Root>
          <Text flex="1" textAlign="right" textTransform="capitalize">
            {item.internal_id}
          </Text>
        </HStack>
        {item.firstSeen && (
          <HStack>
            <Tag.Root size="lg" fontWeight="bold" as="h3">
              <Tag.Label>{t('ItemPage.first-seen')}</Tag.Label>
            </Tag.Root>
            <Text flex="1" textAlign="right">
              {format.dateTime(new Date(item.firstSeen), {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
              })}
            </Text>
          </HStack>
        )}
      </Flex>
    </Flex>
  );
};

export default ItemInfoCard;
