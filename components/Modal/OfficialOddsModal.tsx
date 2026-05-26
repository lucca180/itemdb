import {
  Text,
  Flex,
  Table,
  Accordion,
  Box,
  Link,
  Dialog,
  CloseButton,
  Portal,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';

export type OddsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const OfficialOddsModal = (props: OddsModalProps) => {
  const t = useTranslations();
  const { isOpen, onClose } = props;

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={({ open }) => {
        if (!open) onClose();
      }}
      placement="center"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content pt={0} maxW="2xl" w="full">
            <Dialog.Header>
              <Dialog.Title>{t('ItemPage.official-nc-mall-drops')}</Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
            <Dialog.Body>
              <Text fontSize={'sm'} mb={3} color={'gray.400'}>
                {t.rich('ItemPage.official-drops-desc', {
                  Link: (c) => (
                    <Link
                      href="https://classic.support.neopets.com/hc/en-us/articles/37898249845261-NC-Mall-Drop-Rates"
                      target="_blank"
                      rel="noreferrer"
                      color="gray.200"
                    >
                      {c}
                    </Link>
                  ),
                })}
              </Text>
              <Accordion.Root collapsible multiple defaultValue={[categories[0]]}>
                {categories.map((cat) => (
                  <Accordion.Item
                    bg="blackAlpha.400"
                    key={cat}
                    value={cat}
                    p={2}
                    borderRadius={'md'}
                    mb={2}
                  >
                    <Accordion.ItemTrigger>
                      <Box as="span" flex="1" textAlign="left" color="gray.400">
                        {cat}
                      </Box>
                      <Accordion.ItemIndicator />
                    </Accordion.ItemTrigger>
                    <Accordion.ItemContent>
                      <Accordion.ItemBody p={0}>
                        <Table.Root variant="line" fontSize={'sm'} size="sm">
                          <Table.Caption m={0} color="whiteAlpha.700">
                            {t('ItemPage.drops-same-change')}
                          </Table.Caption>
                          <Table.Body>
                            {odds
                              .filter((a) => a.category === cat)
                              .map((o) => (
                                <Table.Row key={o.title}>
                                  <Table.Cell w="30%">{o.title}</Table.Cell>
                                  {o.odds.map((odd) => (
                                    <Table.Cell key={odd.desc}>
                                      <Flex textAlign={'center'} flexFlow={'column'} gap={1}>
                                        {odd.val > 0 && <Text>{`${odd.val}%`}</Text>}
                                        <Text color="whiteAlpha.600" fontSize={'xs'}>
                                          {odd.desc}
                                        </Text>
                                      </Flex>
                                    </Table.Cell>
                                  ))}
                                </Table.Row>
                              ))}
                          </Table.Body>
                        </Table.Root>
                      </Accordion.ItemBody>
                    </Accordion.ItemContent>
                  </Accordion.Item>
                ))}
              </Accordion.Root>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default OfficialOddsModal;

const odds = [
  {
    title: 'Regular Mystery Capsule',
    category: 'Mystery Capsules',
    odds: [
      {
        val: 27,
        desc: '1 item + 1 bonus',
      },
      {
        val: 73,
        desc: '1 item',
      },
    ],
  },
  {
    title: 'Mini Mystery Capsule (Pet Day)',
    category: 'Mystery Capsules',
    odds: [
      {
        val: 10,
        desc: '1 bonus',
      },
      {
        val: 90,
        desc: '1 item',
      },
    ],
  },
  {
    title: 'Mini Mystery Capsule (5-6 items)',
    category: 'Mystery Capsules',
    odds: [
      {
        val: 0,
        desc: 'No Bonus',
      },
      {
        val: 100,
        desc: '1 item',
      },
    ],
  },
  {
    title: 'Closet Essentials',
    category: 'Mystery Capsules',
    odds: [
      {
        val: 10,
        desc: '2 items',
      },
      {
        val: 90,
        desc: '1 item',
      },
    ],
  },
  {
    title: 'Retired',
    category: 'Retired Capsules',
    odds: [
      {
        val: 12,
        desc: '2 items',
      },
      {
        val: 88,
        desc: '1 item',
      },
    ],
  },
  {
    title: 'Retired (with new items)',
    category: 'Retired Capsules',
    odds: [
      {
        val: 24,
        desc: '2 items + 1 bonus',
      },
      {
        val: 76,
        desc: '1 item',
      },
    ],
  },
  {
    title: 'Altador Cup Retired',
    category: 'Retired Capsules',
    odds: [
      {
        val: 10,
        desc: '2 items',
      },
      {
        val: 90,
        desc: '1 item',
      },
    ],
  },
  {
    title: 'Retired Superpack',
    category: 'Retired Capsules',
    odds: [
      {
        val: 12,
        desc: '1 bonus item',
      },
      {
        val: 88,
        desc: '1 regular item',
      },
    ],
  },
  {
    title: 'Retired GBMC',
    category: 'Retired Capsules',
    odds: [
      {
        val: 12,
        desc: '2 items',
      },
      {
        val: 88,
        desc: '1 item',
      },
    ],
  },
  {
    title: 'Gift Box Capsule',
    category: 'GBCs',
    odds: [
      {
        val: 10,
        desc: '2 items (150NC+) + 5 gift boxes',
      },
      {
        val: 15,
        desc: '1 item (150NC+) + 3 gift boxes',
      },
      {
        val: 75,
        desc: '1 item (150NC+) + 2 gift boxes',
      },
    ],
  },
  {
    title: 'Black Friday Gift Box Capsule',
    category: 'GBCs',
    odds: [
      {
        val: 6,
        desc: '2 items (150NC+) + 7 gift boxes',
      },
      {
        val: 10,
        desc: '1 item (150NC+) + 5 gift boxes',
      },
      {
        val: 84,
        desc: '1 item (150NC+) + 4 gift boxes',
      },
    ],
  },
  {
    title: 'NC Mall Birthday',
    category: 'Special',
    odds: [
      {
        val: 30,
        desc: '2 items + 1 bonus',
      },
      {
        val: 70,
        desc: '1 item',
      },
    ],
  },
  {
    title: 'New Year 2024 Celebration',
    category: 'Special',
    odds: [
      {
        val: 30,
        desc: '1 item (150-200 NC) + 1 Bonus',
      },
      {
        val: 90,
        desc: '1 item (150-200 NC)',
      },
    ],
  },
  {
    title: 'Gram',
    category: 'Special',
    odds: [
      {
        val: 20,
        desc: 'Include Bonus',
      },
      {
        val: 80,
        desc: 'No Bonus',
      },
    ],
  },
  {
    title: 'Candles',
    category: 'Special',
    odds: [
      {
        val: 12,
        desc: '1 item + 1 bonus',
      },
      {
        val: 88,
        desc: '1 item',
      },
    ],
  },
];

const categories = Array.from(new Set(odds.map((o) => o.category)));
