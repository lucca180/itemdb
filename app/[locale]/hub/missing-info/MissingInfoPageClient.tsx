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
import { useTranslations } from 'next-intl';
import type { ItemV2For } from '@types';
import ItemCardV2 from '@components/Items/v2/ItemCardV2';
import { useToast } from '@utils/theme/toast';
import type { MissingInfoField, MissingInfoPageLabels } from './buildMissingInfoPageProps';
import { loadMissingInfoItems } from './actions';

const LIMIT_PER_PAGE = 100;
const GRADIENT_RGB = Color('#f0fa94').rgb().round().array();

type MissingInfoPageClientProps = {
  labels: MissingInfoPageLabels;
};

export function MissingInfoPageClient({ labels }: MissingInfoPageClientProps) {
  const t = useTranslations();
  const toast = useToast();
  const [field, setField] = useState<MissingInfoField>('item_id');
  const [items, setItems] = useState<ItemV2For<'card'>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      setLoadError(false);
      try {
        const result = await loadMissingInfoItems({ field, page, limit: LIMIT_PER_PAGE });
        if (!cancelled) setItems(result);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setLoadError(true);
          toast({
            id: 'missing-info-load-error',
            title: t('General.error'),
            status: 'error',
            duration: 8000,
            isClosable: true,
          });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [field, page, toast, t]);

  const selectField = (nextField: MissingInfoField) => {
    setField(nextField);
    setPage(1);
  };

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
              setField={selectField}
              disabled={isLoading}
            >
              {label}
            </TypeButton>
          )
        )}
      </Center>
      <Center alignItems={'stretch'} flexWrap={'wrap'} gap={3} mt={3}>
        {loadError && !isLoading && (
          <Text color="red.300" textAlign="center" w="100%">
            {t('General.error')}
          </Text>
        )}
        {!isLoading &&
          !loadError &&
          items.map((item) => (
            <ItemCardV2 uniqueID="missing-info" key={item.internal_id} item={item} />
          ))}
        {!isLoading && !loadError && items.length === 0 && (
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
