import { Box, Flex, HStack, Tag, Text, Tooltip } from '@chakra-ui/react';
import React from 'react';
import { ItemData } from '../../types';
import { MdHelp } from 'react-icons/md';
type Props = {
  item: ItemData;
};

const ItemInfoCard = (props: Props) => {
  const { item } = props;
  const color = item.color.rgb;

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
          <Tag size="lg" fontWeight="bold">
            Item ID
          </Tag>
          <Text flex="1" textAlign="right">
            {item.item_id ?? '???'}
          </Text>
        </HStack>
        <HStack>
          <Tag size="lg" fontWeight="bold">
            Rarity
          </Tag>
          <Text flex="1" textAlign="right">
            r{item.rarity ?? '???'}
          </Text>
        </HStack>
        <HStack>
          <Tag size="lg" fontWeight="bold">
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
            <Tag size="lg" fontWeight="bold">
              Est. Val <MdHelp size={'0.8rem'} style={{ marginLeft: '0.2rem' }} />
            </Tag>
          </Tooltip>

          <Text flex="1" textAlign="right">
            {item.estVal ?? '???'} NP
          </Text>
        </HStack>
        <HStack>
          <Tag size="lg" fontWeight="bold">
            Category
          </Tag>
          <Text flex="1" textAlign="right" textTransform="capitalize">
            {item.category ?? '???'}
          </Text>
        </HStack>
        <HStack>
          <Tag size="lg" fontWeight="bold">
            Status
          </Tag>
          <Text flex="1" textAlign="right" textTransform="capitalize">
            {item.status ?? 'Active'}
          </Text>
        </HStack>
      </Flex>
    </Flex>
  );
};

export default ItemInfoCard;
