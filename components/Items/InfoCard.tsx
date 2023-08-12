import { Box, Flex, HStack, Tag, Text, Tooltip } from '@chakra-ui/react';
import React from 'react';
import { ItemData } from '../../types';
import { MdHelp } from 'react-icons/md';
import { rarityStr } from '../../utils/utils';

type Props = {
  item: ItemData;
};

const intl = new Intl.NumberFormat();

const ItemInfoCard = (props: Props) => {
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
        Item Info
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
            Item ID
          </Tag>
          <Text flex="1" textAlign="right">
            {item.item_id ?? '???'}
          </Text>
        </HStack>
        <HStack>
          <Tag size="lg" fontWeight="bold" as="h3">
            Rarity
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
            Weight
          </Tag>
          <Text flex="1" textAlign="right">
            {item.weight ?? '???'} lbs
          </Text>
        </HStack>
        <HStack>
          <Tooltip
            hasArrow
            label="Does not reflect the actual price"
            bg="gray.700"
            placement="top"
            color="white"
          >
            <Tag size="lg" fontWeight="bold" as="h3">
              Est. Val <MdHelp size={'0.8rem'} style={{ marginLeft: '0.2rem' }} />
            </Tag>
          </Tooltip>

          <Text flex="1" textAlign="right">
            {item.estVal != null ? intl.format(item.estVal) : '???'} NP
          </Text>
        </HStack>
        <HStack>
          <Tag size="lg" fontWeight="bold" as="h3">
            Category
          </Tag>
          <Text flex="1" textAlign="right" textTransform="capitalize">
            {item.category ?? '???'}
          </Text>
        </HStack>
        <HStack>
          <Tag size="lg" fontWeight="bold" as="h3">
            Status
          </Tag>
          <Text flex="1" textAlign="right" textTransform="capitalize">
            {item.status ?? 'Active'}
          </Text>
        </HStack>
        <HStack>
          <Tag size="lg" fontWeight="bold" as="h3">
            itemdb ID
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
