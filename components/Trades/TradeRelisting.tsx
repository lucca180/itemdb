'use client';

import { Accordion, Box, Flex, Text } from '@chakra-ui/react';
import { useFormatter, useTranslations } from 'next-intl';
import type { ListingRelisting } from '@types';

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
          <Text flex="1" textAlign="left" fontSize="xs" lineHeight="1.5">
            {label}
          </Text>
          <Accordion.ItemIndicator />
        </Accordion.ItemTrigger>
        <Accordion.ItemContent bg={'gray.600'}>
          <Accordion.ItemBody>
            <Flex flexDirection="column">
              {history.map((entry, i) => (
                <Flex
                  key={`${i}-${entry.date}-${entry.price}`}
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
              <Flex
                justifyContent="center"
                alignItems="center"
                mt={2}
                flexDirection="column"
                textAlign="center"
              >
                <Box fontSize="2xs" color="gray.300" maxWidth="400px" textAlign="center">
                  {disclaimer}
                </Box>
              </Flex>
            </Flex>
          </Accordion.ItemBody>
        </Accordion.ItemContent>
      </Accordion.Item>
    </Accordion.Root>
  );
};

const RELISTING_DATE_FORMAT = { month: 'short', day: 'numeric', year: 'numeric' } as const;

export const ListingRelistingBadge = ({ relisting }: { relisting: ListingRelisting }) => {
  const t = useTranslations();
  const format = useFormatter();

  return (
    <TradeRelisting
      disclaimer={t('ItemPage.relisting-disclaimer')}
      history={relisting.history.map((entry) => ({
        date: format.dateTime(new Date(entry.date), RELISTING_DATE_FORMAT),
        price:
          entry.price === null
            ? t('ItemPage.unspecified-price')
            : `${format.number(entry.price)} NP`,
      }))}
      label={t('ItemPage.relisting-history', {
        count: relisting.history.length,
        date: format.dateTime(new Date(relisting.since), RELISTING_DATE_FORMAT),
      })}
    />
  );
};
