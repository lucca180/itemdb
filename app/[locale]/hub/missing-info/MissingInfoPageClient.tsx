/* eslint-disable react-hooks/set-state-in-effect */
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
} from '@chakra-ui/react';
import Color from 'color';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { ItemData } from '@types';
import ItemCard from '@components/Items/ItemCard';
import type { MissingInfoField, MissingInfoPageLabels } from './buildMissingInfoPageProps';

const GRADIENT_RGB = Color('#f0fa94').rgb().round().array();

type MissingInfoPageClientProps = {
  labels: MissingInfoPageLabels;
};

export function MissingInfoPageClient({ labels }: MissingInfoPageClientProps) {
  const [field, setField] = useState<MissingInfoField>('item_id');
  const [items, setItems] = useState<ItemData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);

  const fetchItems = async (newPage: number, activeField: MissingInfoField) => {
    setIsLoading(true);
    const res = await axios.get(`/api/v1/items/missing`, {
      params: { field: activeField, page: newPage },
    });
    setItems(res.data);
    setIsLoading(false);
  };

  useEffect(() => {
    void fetchItems(1, field);
  }, []);

  useEffect(() => {
    setPage(1);
    void fetchItems(1, field);
  }, [field]);

  useEffect(() => {
    void fetchItems(page, field);
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
      <Center my={6} flexFlow="column" gap={2} textAlign="center">
        <Box h="175px" overflow={'hidden'} borderRadius="md" boxShadow={'md'}>
          <Image
            w={400}
            h={175}
            objectPosition={'0 -50px'}
            objectFit={'cover'}
            src="https://images.neopets.com/caption/caption_376.gif"
            alt="Missing Info Hub Thumbnail"
          />
        </Box>
        <Heading as="h1">{labels.heading}</Heading>
        <Text>{labels.description}</Text>
      </Center>
      <Separator my={3} />
      <Center gap={3} flexWrap="wrap">
        {(Object.entries(labels.typeButtons) as [MissingInfoField, string][]).map(
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
      <Center alignItems={'stretch'} flexWrap={'wrap'} gap={3} mt={3}>
        {!isLoading &&
          items.map((item) => (
            <ItemCard uniqueID="missing-info" key={item.internal_id} item={item} />
          ))}
        {!isLoading && items.length === 0 && (
          <VStack>
            <Image maxW="300px" src="/api/cache/preview/bg_waitingrestock.png" alt="empty image" />
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
          <Button disabled={!items.length} onClick={() => setPage(page + 1)}>
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
  field: MissingInfoField;
  setField: (type: MissingInfoField) => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <Button
      size="sm"
      onClick={() => setField(field)}
      colorPalette={selectedField === field ? 'yellow' : undefined}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}
