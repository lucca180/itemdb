import { AspectRatio, Box, Flex, IconButton, Link, Skeleton, Text } from '@chakra-ui/react';
import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { ItemData, ItemEffect } from '../../types';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { useTranslations } from 'next-intl';
import { WearableData } from '@prisma/generated/client';
import { useAuth } from '@utils/auth';
import { FaRotateRight } from 'react-icons/fa6';

type Props = {
  item: ItemData;
  wearableData?: WearableData[] | null;
  colorSpeciesEffect?: ItemEffect | null;
};

const ItemPreview = (props: Props) => {
  const t = useTranslations();
  const [isLoaded, setIsLoaded] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const { user } = useAuth();

  const { item, colorSpeciesEffect, wearableData } = props;
  const color = item.color.rgb;

  useEffect(() => {
    if (isLoaded && isLoaded !== item.internal_id) setIsLoaded(0);
  }, [item]);

  const zonesData = useMemo(() => {
    if (!wearableData) return [];
    const zones: { [id: string]: { label: string; species: string[] } } = {};

    wearableData
      .filter((x) => x.isCanonical)
      .forEach((data) => {
        if (!zones[data.zone_plain_label])
          zones[data.zone_plain_label] = {
            label: data.zone_label,
            species: [],
          };

        if (
          data.species_name &&
          !zones[data.zone_plain_label].species.includes(data.species_name)
        ) {
          zones[data.zone_plain_label].species.push(data.species_name);
        }
      });

    return Object.values(zones);
  }, [wearableData]);

  const refreshPreview = () => {
    setRefresh((prev) => prev + 1);
    setIsLoaded(0);
  };

  const previewUrl = useMemo(() => {
    const cacheHash = item.cacheHash ? '?hash=' + item.cacheHash : '';
    const isRefresh = refresh ? '?refresh=' + true + '&refresh_id=' + refresh : '';

    if (item.isWearable)
      return '/api/cache/preview/' + item.image_id + '.png' + (isRefresh || cacheHash);

    if (!colorSpeciesEffect) return '';

    const { colorTarget, speciesTarget } = colorSpeciesEffect;

    return (
      `/api/cache/preview/color/${speciesTarget}_${colorTarget}.png`.toLowerCase() +
      (isRefresh || cacheHash)
    );
  }, [item, colorSpeciesEffect, refresh]);

  return (
    <Flex
      // flex={1}
      // maxW='300px'
      width="fit-content"
      borderRadius="md"
      overflow="hidden"
      flexFlow="column"
      boxShadow="sm"
      w="100%"
    >
      <Box
        p={2}
        textAlign="center"
        fontWeight="bold"
        bg={`rgba(${color[0]}, ${color[1]}, ${color[2]}, .6)`}
      >
        <Text>{t('ItemPage.item-preview')}</Text>
      </Box>
      <Flex
        position="relative"
        bg="gray.600"
        gap={4}
        flexWrap="wrap"
        justifyContent="center"
        alignItems="center"
        h="100%"
        _hover={
          user && !user?.banned && !!isLoaded
            ? {
                '.refresh-button': {
                  display: 'flex',
                },
              }
            : undefined
        }
      >
        <IconButton
          position={'absolute'}
          zIndex={1000}
          top={0}
          right={0}
          m={2}
          size="sm"
          data-umami-event="refresh-preview"
          className="refresh-button"
          display={'none'}
          onClick={refreshPreview}
          isDisabled={refresh >= 2}
          shadow={'md'}
          bg="gray.700"
          _hover={{
            bg: 'gray.800',
          }}
          aria-label="Refresh Preview"
          icon={<FaRotateRight />}
        />
        <Skeleton minW={300} minH={300} h="100%" w="100%" isLoaded={!!isLoaded}>
          <AspectRatio ratio={1}>
            <>
              <Image
                src={previewUrl}
                alt="Item Preview"
                unoptimized
                fill
                priority
                onLoadStart={() => setIsLoaded(0)}
                onLoad={() => setIsLoaded(item.internal_id)}
              />
            </>
          </AspectRatio>
        </Skeleton>
      </Flex>
      <Box p={1} textAlign="center" bg={`rgba(${color[0]}, ${color[1]}, ${color[2]}, .6)`}>
        {zonesData.length > 0 && (
          <Text fontSize="xs" p={1}>
            <b>{t('ItemPage.occupies')}:</b>{' '}
            {zonesData.map((x, i) => x.label + (i + 1 == zonesData.length ? '' : ', '))}
          </Text>
        )}
        <Text fontSize="xs">
          {t('ItemPage.powered-by')}{' '}
          <Link href={item.findAt.dti ?? undefined} isExternal fontWeight="bold">
            Dress To Impress <ExternalLinkIcon mx="1px" verticalAlign="baseline" />
          </Link>
        </Text>
      </Box>
    </Flex>
  );
};

export default ItemPreview;
