import type { ReactNode } from 'react';
import {
  Badge,
  Box,
  Button,
  Dialog,
  Flex,
  HStack,
  Image,
  Link,
  Portal,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useFormatter, useTranslations } from 'next-intl';
import MainLink from '@components/Utils/MainLink';
import type { PracticeStockedItem } from '@utils/restockPractice';

export type PracticeResult = {
  /** null when the timer is turned off */
  reactionMs: number | null;
  picked: PracticeStockedItem;
  missed: PracticeStockedItem[];
  isBestPick: boolean;
  /** false when nothing in the restock was worth buying — the right move was to refresh */
  hasProfitableItems: boolean;
};

type PracticeResultModalProps = {
  result: PracticeResult | null;
  onNext: () => void;
};

// Rough thresholds — tune once we have real session data
const getReactionColor = (ms: number) => (ms < 600 ? 'green' : ms < 1000 ? 'yellow' : 'red');

export function PracticeResultModal({ result, onNext }: PracticeResultModalProps) {
  const t = useTranslations();
  const format = useFormatter();

  const formatNP = (value: number) => `${format.number(value)} NP`;

  return (
    <Dialog.Root
      open={!!result}
      onOpenChange={({ open }) => !open && onNext()}
      placement="center"
      size="sm"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            {result && (
              <>
                <Dialog.Header flexDirection="column" alignItems="center" gap={1}>
                  {result.reactionMs !== null ? (
                    <>
                      <Text fontSize="xs" color="whiteAlpha.700" textTransform="uppercase">
                        {t('Restock.practice-reaction-time')}
                      </Text>
                      <Dialog.Title
                        fontSize="4xl"
                        fontWeight="bold"
                        color={`${getReactionColor(result.reactionMs)}.300`}
                      >
                        {t('Restock.practice-ms', {
                          x: format.number(Math.round(result.reactionMs)),
                        })}
                      </Dialog.Title>
                    </>
                  ) : (
                    <Dialog.Title
                      fontSize="2xl"
                      fontWeight="bold"
                      color={result.isBestPick ? 'green.300' : 'yellow.300'}
                    >
                      {result.isBestPick
                        ? t('Restock.practice-best-pick')
                        : result.hasProfitableItems
                          ? t('Restock.practice-better-options')
                          : t('Restock.practice-nothing-worth-buying')}
                    </Dialog.Title>
                  )}
                </Dialog.Header>
                <Dialog.Body>
                  <Stack gap={4}>
                    <Box bg="blackAlpha.300" borderRadius="md" p={3}>
                      <HStack justify="space-between" mb={2}>
                        <Text fontSize="xs" color="whiteAlpha.700">
                          {t('Restock.practice-you-bought')}
                        </Text>
                        {result.isBestPick && result.reactionMs !== null && (
                          <Badge colorPalette="green">{t('Restock.practice-best-pick')}</Badge>
                        )}
                      </HStack>
                      <HStack gap={3} align="center">
                        <Image src={result.picked.image} alt={result.picked.name} boxSize="60px" />
                        <Stack gap={0} flex={1} fontSize="sm">
                          <ItemName item={result.picked} fontWeight="bold" />
                          <Text>
                            {t('Restock.practice-shop-price')}: {formatNP(result.picked.shopPrice)}
                          </Text>
                          {result.picked.marketPrice !== null && result.picked.profit !== null ? (
                            <>
                              <Text>
                                {t('Restock.practice-market-price')}:{' '}
                                {formatNP(result.picked.marketPrice)}
                              </Text>
                              <Text
                                fontWeight="bold"
                                color={result.picked.profit >= 0 ? 'green.300' : 'red.300'}
                              >
                                {t('Restock.practice-profit')}: {formatNP(result.picked.profit)}
                              </Text>
                            </>
                          ) : (
                            <Text color="whiteAlpha.700">
                              {t('Restock.practice-unknown-price')}
                            </Text>
                          )}
                        </Stack>
                      </HStack>
                    </Box>

                    {!result.hasProfitableItems && (
                      <Text fontSize="sm" color="yellow.300" textAlign="center">
                        {t('Restock.practice-no-profitable-items')}
                      </Text>
                    )}

                    {result.missed.length > 0 && (
                      <Box>
                        <Text fontSize="sm" fontWeight="bold" mb={2}>
                          {t('Restock.practice-missed-items')}
                        </Text>
                        <Stack gap={2}>
                          {result.missed.map((item) => (
                            <Flex
                              key={item.id}
                              align="center"
                              gap={3}
                              bg="blackAlpha.300"
                              borderRadius="md"
                              p={2}
                              fontSize="sm"
                            >
                              <Image src={item.image} alt={item.name} boxSize="40px" />
                              <Stack gap={0} flex={1}>
                                <ItemName item={item} fontWeight="bold" />
                                {item.marketPrice !== null && (
                                  <Text fontSize="xs" color="whiteAlpha.700">
                                    {t('Restock.practice-market-price')}:{' '}
                                    {formatNP(item.marketPrice)}
                                  </Text>
                                )}
                              </Stack>
                              {item.profit !== null && (
                                <Text fontWeight="bold" color="green.300">
                                  +{formatNP(item.profit)}
                                </Text>
                              )}
                            </Flex>
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Stack>
                </Dialog.Body>
                <Dialog.Footer flexDirection="column" gap={1}>
                  <Button w="100%" colorPalette="green" onClick={onNext}>
                    {t('Restock.practice-next-restock')}
                  </Button>
                  <Text fontSize="xs" color="whiteAlpha.600">
                    {t('Restock.practice-refresh-hint')}
                  </Text>
                </Dialog.Footer>
              </>
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

function ItemName({ item, fontWeight }: { item: PracticeStockedItem; fontWeight?: string }) {
  const name: ReactNode = <Text fontWeight={fontWeight}>{item.name}</Text>;
  if (!item.slug) return name;

  return (
    <Link asChild color="inherit">
      <MainLink href={`/item/${item.slug}`} target="_blank">
        {name}
      </MainLink>
    </Link>
  );
}
