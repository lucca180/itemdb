import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Text,
  Flex,
  Table,
  TableCaption,
  Tbody,
  Td,
  Tr,
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Link,
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
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="2xl">
      <ModalOverlay />
      <ModalContent pt={0}>
        <ModalHeader>{t('ItemPage.official-nc-mall-drops')}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text fontSize={'sm'} mb={3} color={'gray.400'}>
            {t.rich('ItemPage.official-drops-desc', {
              Link: (c) => (
                <Link
                  href="https://classic.support.neopets.com/hc/en-us/articles/37898249845261-NC-Mall-Drop-Rates"
                  isExternal
                  color="gray.200"
                >
                  {c}
                </Link>
              ),
            })}
          </Text>
          <Accordion allowToggle defaultIndex={[0]} allowMultiple>
            {categories.map((cat) => (
              <AccordionItem bg="blackAlpha.400" key={cat} p={2} borderRadius={'md'} mb={2}>
                <h2>
                  <AccordionButton>
                    <Box as="span" flex="1" textAlign="left" color="gray.400">
                      {cat}
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel p={0}>
                  <Table variant="simple" fontSize={'sm'} size="sm">
                    <TableCaption m={0} color="whiteAlpha.700">
                      {t('ItemPage.drops-same-change')}
                    </TableCaption>
                    <Tbody>
                      {odds
                        .filter((a) => a.category === cat)
                        .map((o) => (
                          <Tr key={o.title}>
                            <Td w="30%">{o.title}</Td>
                            {o.odds.map((odd) => (
                              <Td key={odd.desc}>
                                <Flex textAlign={'center'} flexFlow={'column'} gap={1}>
                                  {odd.val > 0 && <Text>{`${odd.val}%`}</Text>}
                                  <Text color="whiteAlpha.600" fontSize={'xs'}>
                                    {odd.desc}
                                  </Text>
                                </Flex>
                              </Td>
                            ))}
                          </Tr>
                        ))}
                    </Tbody>
                  </Table>
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </ModalBody>
      </ModalContent>
    </Modal>
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
