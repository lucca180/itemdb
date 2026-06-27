'use client';

import {
  Box,
  Center,
  Heading,
  Image,
  Separator,
  Text,
  Button,
  Spinner,
  VStack,
  NativeSelect,
} from '@chakra-ui/react';
import Color from 'color';
import { ChangeEvent, useEffect, useState } from 'react';
import axios from 'axios';
import { ItemData, ItemEffect } from '@types';
import { EffectsCard } from '@components/Hubs/Effects/EffectsCard';
import type { ItemEffectsField, ItemEffectsPageLabels } from './buildItemEffectsPageProps';

const LIMIT_PER_PAGE = 18;
const GRADIENT_RGB = Color('#f86dba').rgb().round().array();

type ItemEffectsPageClientProps = {
  labels: ItemEffectsPageLabels;
};

export function ItemEffectsPageClient({ labels }: ItemEffectsPageClientProps) {
  const [field, setField] = useState<ItemEffectsField>('stats');
  const [items, setItems] = useState<(ItemData & { effects: ItemEffect[] })[]>([]);
  const [statsName, setStatsName] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchItems = async (
    newPage: number,
    activeField: ItemEffectsField,
    activeStats: string
  ) => {
    setIsLoading(true);
    try {
      const res = await axios.get(`/api/v1/items/effects`, {
        params: {
          field: activeField,
          page: newPage,
          limit: LIMIT_PER_PAGE,
          name: activeField === 'stats' && activeStats !== 'all' ? activeStats : undefined,
        },
      });
      setItems(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchItems(1, field, statsName);
  }, []);

  useEffect(() => {
    setPage(1);
    void fetchItems(1, field, statsName);
  }, [field, statsName]);

  useEffect(() => {
    void fetchItems(page, field, statsName);
  }, [page]);

  return (
    <>
      <Box
        position="absolute"
        h="650px"
        left="0"
        width="100%"
        bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${GRADIENT_RGB[0]},${GRADIENT_RGB[1]},${GRADIENT_RGB[2]},.7) 70%)`}
        zIndex={-1}
      />
      <Center my={6} flexFlow="column" gap={2} textAlign={'center'}>
        <Box h="175px" overflow={'hidden'} borderRadius="md" boxShadow={'md'}>
          <Image
            w={400}
            h={175}
            objectPosition={'bottom'}
            objectFit={'cover'}
            src="https://images.neopets.com/games/new_tradingcards/lg_scorchio_day_2006.gif"
            alt="Item Effects Hub Thumbnail"
          />
        </Box>
        <Heading as="h1">{labels.heading}</Heading>
        <Text>{labels.cta}</Text>
      </Center>
      <Separator my={3} />
      <Center gap={3} flexWrap={'wrap'}>
        {(Object.entries(labels.typeButtons) as [ItemEffectsField, string][]).map(
          ([type, label]) => (
            <TypeButton
              key={type}
              field={type}
              selectedField={field}
              setField={setField}
              disabled={isLoading}
            >
              {label}
            </TypeButton>
          )
        )}
      </Center>
      {field === 'stats' && (
        <Center mt={3}>
          <NativeSelect.Root maxW={200} size="sm" variant="subtle" colorPalette="pink">
            <NativeSelect.Field
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatsName(e.target.value)}
            >
              <option value="all">{labels.allStatsLabel}</option>
              {labels.statsOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Center>
      )}
      <Center alignItems={'stretch'} flexWrap={'wrap'} gap={3} mt={3}>
        {!isLoading &&
          items.map((item) => (
            <EffectsCard uniqueID={`${field}-item-effect`} key={item.internal_id} item={item} />
          ))}
        {!isLoading && items.length === 0 && (
          <VStack>
            <Text>{labels.emptyMessage}</Text>
          </VStack>
        )}
        {isLoading && <Spinner />}
      </Center>
      <Center mt={5} gap={3}>
        {!isLoading && (
          <Button disabled={page <= 1} onClick={() => setPage(page - 1)}>
            {labels.prevPage}
          </Button>
        )}
        {!isLoading && (
          <Button
            disabled={!items.length || items.length < LIMIT_PER_PAGE}
            onClick={() => setPage(page + 1)}
          >
            {labels.nextPage}
          </Button>
        )}
      </Center>
    </>
  );
}

function TypeButton({
  selectedField,
  field,
  setField,
  children,
  disabled,
}: {
  selectedField: string;
  field: ItemEffectsField;
  setField: (type: ItemEffectsField) => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <Button
      size="sm"
      onClick={() => setField(field)}
      colorPalette={selectedField === field ? 'pink' : undefined}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}
