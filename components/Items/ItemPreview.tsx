import { AspectRatio, Box, Button, Flex, IconButton, Link, Skeleton, Text } from '@chakra-ui/react';
import React, { useMemo, useState } from 'react';
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
  const [isIframeLoaded, setIsIframeLoaded] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const { user } = useAuth();
  const [variation, setVariation] = useState('static');
  const { item, colorSpeciesEffect, wearableData } = props;
  const color = item.color.rgb;
  const isWearable = item.isWearable;

  if (isLoaded && isLoaded !== item.internal_id) setIsLoaded(0);

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

  const handleVarChange = (newVariation: string) => {
    const iframeA = document.getElementById('animated-preview-iframe') as HTMLIFrameElement;
    const iframes = iframeA?.contentDocument?.getElementsByTagName('iframe');

    // If there are multiple iframes, we need to send the message to all of them
    // to ensure they all play/pause correctly.
    if (iframes && iframes.length) {
      [...iframes].map((iframe) => {
        iframe?.contentWindow?.postMessage(
          {
            type: newVariation === 'animated' ? 'play' : 'pause',
          },
          '*'
        );
      });
    }

    window.umami?.track('item-preview-variation', {
      variation: newVariation,
    });

    setVariation(newVariation);
  };

  return (
    <Flex
      width="fit-content"
      borderRadius="md"
      overflow="hidden"
      flexFlow="column"
      boxShadow="sm"
      w="100%"
    >
      <Flex
        p={2}
        textAlign="center"
        fontWeight="bold"
        flexFlow="column"
        bg={`rgba(${color[0]}, ${color[1]}, ${color[2]}, .6)`}
      >
        <Text>{t('ItemPage.item-preview')}</Text>
        {isWearable && (
          <Flex justifyContent={'center'} gap={2} mt={1}>
            <Button
              size="xs"
              variant={variation === 'static' ? 'solid' : 'ghost'}
              onClick={() => handleVarChange('static')}
            >
              Static
            </Button>
            <Button
              size="xs"
              variant={variation === 'animated' ? 'solid' : 'ghost'}
              onClick={() => handleVarChange('animated')}
            >
              HTML5
            </Button>
          </Flex>
        )}
      </Flex>
      {variation === 'static' && (
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
      )}
      {(variation === 'animated' || !!isIframeLoaded) && (
        <Flex
          position="relative"
          bg="gray.600"
          h="100%"
          display={variation === 'animated' ? 'flex' : 'none'}
        >
          <Skeleton minW={300} minH={300} h="100%" w="100%" isLoaded={!!isIframeLoaded}>
            <AspectRatio ratio={1}>
              <iframe
                id="animated-preview-iframe"
                src={`/api/cache/preview/${item.image_id}/animated`}
                title="Item Animated Preview"
                onLoadStart={() => setIsIframeLoaded(0)}
                onLoad={() => setIsIframeLoaded(item.internal_id)}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  pointerEvents: 'none',
                  background: 'transparent',
                }}
              />
            </AspectRatio>
          </Skeleton>
        </Flex>
      )}
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
