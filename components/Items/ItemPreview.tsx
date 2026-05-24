import { AspectRatio, Box, Button, Flex, IconButton, Link, Skeleton, Text } from '@chakra-ui/react';
import CardBase from '@components/Card/CardBase';
import React, { useMemo, useState, memo, useCallback } from 'react';
import Image from 'next/image';
import { ItemData, ItemEffect, WearableData } from '../../types';
import { ExternalLinkIcon } from '@utils/theme/chakraIcons';
import { useTranslations } from 'next-intl';
import { useAuth } from '@utils/auth';
import { FaRotateRight } from 'react-icons/fa6';

type Props = {
  item: ItemData;
  wearableData?: WearableData | null;
  colorSpeciesEffect?: ItemEffect | null;
};

const ItemPreview = (props: Props) => {
  const t = useTranslations();
  const [loadedPreviewUrl, setLoadedPreviewUrl] = useState('');
  const [loadedIframeImageId, setLoadedIframeImageId] = useState('');
  const [refresh, setRefresh] = useState(0);
  const { user } = useAuth();
  const [variation, setVariation] = useState('static');
  const { item, colorSpeciesEffect, wearableData } = props;
  const color = item.color.rgb;
  const isWearable = item.isWearable;

  const refreshPreview = () => {
    setRefresh((prev) => prev + 1);
    setLoadedPreviewUrl('');
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

  const handleIframeLoadStart = useCallback(() => setLoadedIframeImageId(''), []);
  const handleIframeLoad = useCallback(
    () => setLoadedIframeImageId(item.image_id),
    [item.image_id]
  );

  return (
    <CardBase
      title={
        <>
          <Text>{t('ItemPage.item-preview')}</Text>
          {isWearable && (
            <Flex justifyContent={'center'} gap={2} mt={1}>
              <Button
                size="2xs"
                colorPalette="whiteAlpha"
                variant={variation === 'static' ? 'subtle' : 'ghost'}
                onClick={() => handleVarChange('static')}
              >
                Static
              </Button>
              <Button
                size="2xs"
                colorPalette="whiteAlpha"
                variant={variation === 'animated' ? 'subtle' : 'ghost'}
                onClick={() => handleVarChange('animated')}
              >
                HTML5
              </Button>
            </Flex>
          )}
        </>
      }
      color={color}
      noPadding
      chakraWrapper={{ width: 'fit-content', borderRadius: 'md', w: '100%' }}
      chakraTitle={{ as: 'div', display: 'flex', flexFlow: 'column' }}
      chakra={{ h: 'auto' }}
    >
      {variation === 'static' && (
        <Flex
          position="relative"
          bg="gray.600"
          gap={4}
          flexWrap="wrap"
          justifyContent="center"
          alignItems="center"
          _hover={
            user && !user?.banned && !!loadedPreviewUrl
              ? {
                  '& .refresh-button': {
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
            size="xs"
            data-umami-event="refresh-preview"
            className="refresh-button"
            display={'none'}
            onClick={refreshPreview}
            disabled={refresh >= 2}
            shadow={'sm'}
            bg="gray.700"
            color="white"
            _hover={{
              bg: 'gray.800',
            }}
            aria-label="Refresh Preview"
          >
            <FaRotateRight />
          </IconButton>
          <Skeleton minW={300} w="100%" aspectRatio={1} loading={loadedPreviewUrl !== previewUrl}>
            <Box aspectRatio={1} position="relative" w="100%">
              <Image
                key={previewUrl}
                src={previewUrl}
                alt="Item Preview"
                unoptimized
                fill
                sizes="300px"
                loading="eager"
                onLoad={() => setLoadedPreviewUrl(previewUrl)}
                style={{ objectFit: 'contain' }}
              />
            </Box>
          </Skeleton>
        </Flex>
      )}
      {(variation === 'animated' || !!loadedIframeImageId) && (
        <Flex
          position="relative"
          bg="gray.600"
          w="100%"
          aspectRatio={1}
          display={variation === 'animated' ? 'flex' : 'none'}
        >
          {loadedIframeImageId !== item.image_id && (
            <Skeleton
              position="absolute"
              inset={0}
              zIndex={1}
              minW={300}
              minH={300}
              h="100%"
              w="100%"
            />
          )}
          <AnimatedPreview
            key={'animated-iframe-' + item.image_id}
            imageId={item.image_id}
            onLoadStart={handleIframeLoadStart}
            onLoad={handleIframeLoad}
          />
        </Flex>
      )}
      <Box p={1} textAlign="center" bg={`rgba(${color[0]}, ${color[1]}, ${color[2]}, .6)`}>
        {wearableData && wearableData.zone_label.length > 0 && (
          <Text fontSize="xs" p={1}>
            <b>{t('ItemPage.occupies')}:</b>{' '}
            {wearableData.zone_label.map(
              (x, i) => x + (i + 1 == wearableData.zone_label.length ? '' : ', ')
            )}
          </Text>
        )}
        <Text fontSize="xs">
          {t('ItemPage.powered-by')}{' '}
          <Link
            href={item.findAt.dti ?? undefined}
            target="_blank"
            rel="noreferrer"
            fontWeight="bold"
          >
            Dress To Impress <ExternalLinkIcon mx="1px" verticalAlign="baseline" />
          </Link>
        </Text>
      </Box>
    </CardBase>
  );
};

export default ItemPreview;
interface AnimatedPreviewProps {
  imageId: string;
  onLoadStart: () => void;
  onLoad: () => void;
}

const AnimatedPreview = memo(({ imageId, onLoadStart, onLoad }: AnimatedPreviewProps) => {
  const handleLoadStart = useCallback(() => {
    onLoadStart();
  }, [onLoadStart]);

  const handleLoad = useCallback(() => {
    onLoad();
  }, [onLoad]);

  return (
    <AspectRatio ratio={1} w="100%">
      <iframe
        id="animated-preview-iframe"
        key={'animated-iframe-' + imageId}
        src={`/api/cache/preview/${imageId}/animated`}
        onLoadStart={handleLoadStart}
        onLoad={handleLoad}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          pointerEvents: 'none',
          background: 'transparent',
        }}
      />
    </AspectRatio>
  );
});

AnimatedPreview.displayName = 'AnimatedPreview';
