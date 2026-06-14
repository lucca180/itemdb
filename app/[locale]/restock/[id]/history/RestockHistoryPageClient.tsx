'use client';

import {
  Center,
  Flex,
  HStack,
  IconButton,
  Link,
  NativeSelect,
  Separator,
  Spinner,
  Text,
} from '@chakra-ui/react';
import RestockHistoryCard from '@components/Hubs/Restock/RestockHistoryCard';
import { ContributeWall } from '@components/Utils/ContributeWall';
import MainLink from '@components/Utils/MainLink';
import type { ContributeWallData, ItemData, ItemRestockData, ShopInfo } from '@types';
import axios from 'axios';
import { MdRefresh } from 'react-icons/md';
import { useEffect, useState } from 'react';
import type { RestockHistoryClientLabels } from './buildRestockHistoryPageProps';

type RestockHistoryPageClientProps = {
  shopInfo: ShopInfo;
  labels: RestockHistoryClientLabels;
};

export function RestockHistoryPageClient({ shopInfo, labels }: RestockHistoryPageClientProps) {
  const [mode, setMode] = useState('30days');
  const [isLoading, setLoading] = useState(false);
  const [restockData, setRestockData] = useState<(ItemRestockData & { item: ItemData })[] | null>();
  const [sortMode, setSortMode] = useState('price');
  const [wall, setWall] = useState<ContributeWallData | null>(null);

  const init = async (newMode?: string) => {
    setLoading(true);
    setWall(null);
    try {
      const res = await axios.get(
        `/api/v1/restock/history?id=${shopInfo.id}&mode=${newMode ?? mode}`
      );

      setRestockData(sortRestock(res.data, sortMode));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(error);

        if (error.response?.status === 403) {
          setWall(error.response?.data);
          console.error(error.response?.data);
        }
      }
    }

    setLoading(false);
  };

  const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMode(e.target.value);
    init(e.target.value);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortMode(e.target.value);
    setRestockData(sortRestock(restockData, e.target.value));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    init();
  }, []);

  return (
    <>
      <Separator />
      <Center mt={2}>
        <HStack>
          <NativeSelect.Root variant="subtle" size="sm" borderRadius="md" disabled={isLoading}>
            <NativeSelect.Field onChange={handleModeChange} value={mode} bg="blackAlpha.300">
              {labels.modeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
          <NativeSelect.Root variant="subtle" size="sm" borderRadius="md" disabled={isLoading}>
            <NativeSelect.Field onChange={handleSortChange} value={sortMode} bg="blackAlpha.300">
              <option value="price">{labels.priceOrder}</option>
              <option value="addedAt">{labels.chronologicalOrder}</option>
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
          <IconButton
            size="sm"
            bg="blackAlpha.300"
            aria-label="Refresh"
            onClick={() => init()}
            disabled={isLoading}
          >
            <MdRefresh />
          </IconButton>
        </HStack>
      </Center>
      {!wall && (
        <Center mt={3} gap={5} flexFlow="column">
          {isLoading && <Spinner />}
          {!isLoading && (
            <Flex gap={5} flexWrap="wrap" justifyContent="center">
              {restockData &&
                !!restockData.length &&
                restockData.map((restock) => (
                  <RestockHistoryCard key={restock.internal_id} restock={restock} />
                ))}
              {restockData && !restockData.length && (
                <Text color="red.300">{labels.historyEmpty}</Text>
              )}
            </Flex>
          )}
          <Text textAlign="center" mt={8} fontSize="xs">
            {labels.infoUpToDateWarning}
            <br />
            <Link asChild color="gray.400">
              <MainLink href="/contribute" prefetch={false}>
                {labels.learnHelp}
              </MainLink>
            </Link>
          </Text>
        </Center>
      )}
      {wall && <ContributeWall textType="Restock" color={shopInfo.color} wall={wall} />}
    </>
  );
}

function sortRestock(
  restock: (ItemRestockData & { item: ItemData })[] | null | undefined,
  sort: string
) {
  if (!restock) return restock;
  if (sort === 'price') {
    return restock.sort((a, b) => (b.item.price.value ?? 0) - (a.item.price.value ?? 0));
  }

  return restock.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
}
