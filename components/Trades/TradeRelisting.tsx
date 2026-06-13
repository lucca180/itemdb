'use client';

import { Accordion, Box, Flex, Text } from '@chakra-ui/react';

type TradeRelistingBadgeProps = {
  disclaimer: string;
  history: {
    date: string;
    price: string;
  }[];
  label: string;
};

export const TradeRelisting = ({ disclaimer, history, label }: TradeRelistingBadgeProps) => {
  return (
    <Accordion.Root
      mt={1}
      collapsible
      lazyMount
      unmountOnExit
      variant="subtle"
      size="sm"
      width="full"
    >
      <Accordion.Item value={label} border="none" bg={'gray.600'}>
        <Accordion.ItemTrigger px={2} py={1} borderRadius="sm" gap={2} cursor="pointer">
          <Text flex="1" textAlign="left" fontSize="xs">
            {label}
          </Text>
          <Accordion.ItemIndicator />
        </Accordion.ItemTrigger>
        <Accordion.ItemContent bg={'gray.600'}>
          <Accordion.ItemBody>
            <Flex flexDirection="column">
              {history.map((entry, i) => (
                <Flex
                  key={`${entry.date}-${entry.price}`}
                  gap={3}
                  fontSize="xs"
                  justifyContent="space-between"
                  bg={i % 2 === 0 ? 'blackAlpha.300' : 'blackAlpha.500'}
                  p={2}
                >
                  <Text color="gray.200">{entry.date}</Text>
                  <Text color="gray.100" fontWeight="bold">
                    {entry.price}
                  </Text>
                </Flex>
              ))}
              <Box fontSize="2xs" color="gray.300" maxWidth="400px" textAlign="center" mt={2}>
                {disclaimer}
              </Box>
            </Flex>
          </Accordion.ItemBody>
        </Accordion.ItemContent>
      </Accordion.Item>
    </Accordion.Root>
  );
};
