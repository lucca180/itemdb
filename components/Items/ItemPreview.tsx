import { AspectRatio, Box, Flex, Link, Skeleton, Text } from '@chakra-ui/react';
import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { ItemData } from '../../types';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { useTranslations } from 'next-intl';
import { WearableData } from '@prisma/client';

type Props = {
  item: ItemData;
  wearableData?: WearableData[] | null;
};

const ItemPreview = (props: Props) => {
  const t = useTranslations();
  const [isLoaded, setIsLoaded] = useState(0);
  const { item } = props;
  const color = item.color.rgb;

  useEffect(() => {
    if (isLoaded && isLoaded !== item.internal_id) setIsLoaded(0);
  }, [item]);

  const zonesData = useMemo(() => {
    if (!props.wearableData) return [];
    const zones: { [id: string]: { label: string; species: string[] } } = {};

    props.wearableData
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
  }, [props.wearableData]);

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
      >
        <Skeleton minW={300} minH={300} h="100%" w="100%" isLoaded={!!isLoaded}>
          <AspectRatio ratio={1}>
            <Image
              src={'/api/cache/preview/' + item.image_id + '.png'}
              alt="Item Preview"
              unoptimized
              fill
              priority
              onLoadStart={() => setIsLoaded(0)}
              onLoad={() => setIsLoaded(item.internal_id)}
            />
          </AspectRatio>
        </Skeleton>
      </Flex>
      <Box p={1} textAlign="center" bg={`rgba(${color[0]}, ${color[1]}, ${color[2]}, .6)`}>
        <Text fontSize="xs" p={1}>
          <b>{t('ItemPage.occupies')}:</b>{' '}
          {zonesData.map((x, i) => x.label + (i + 1 == zonesData.length ? '' : ', '))}
        </Text>
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
