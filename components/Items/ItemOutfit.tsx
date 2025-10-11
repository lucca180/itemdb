import { AspectRatio, Box, Flex, IconButton, Link, Skeleton, Text } from '@chakra-ui/react';
import { useMemo, useState, memo, useCallback } from 'react';
import Image from 'next/image';
import { ItemData } from '../../types';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { useTranslations } from 'next-intl';
import { useAuth } from '@utils/auth';
import { FaRotateRight } from 'react-icons/fa6';
import { getSpeciesId } from '@utils/pet-utils';

type Props = {
  item: ItemData;
  outfitList: number[];
};

const ItemOutfit = (props: Props) => {
  const t = useTranslations();
  const [isLoaded, setIsLoaded] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const { user } = useAuth();
  const { outfitList, item } = props;
  const color = item.color.rgb;

  if (isLoaded && isLoaded !== item.internal_id) setIsLoaded(0);

  const refreshPreview = () => {
    setRefresh((prev) => prev + 1);
    setIsLoaded(0);
  };

  const previewUrl = useMemo(() => {
    const cacheHash = item.cacheHash ? 'hash=' + item.cacheHash : '';
    const isRefresh = refresh ? 'refresh=' + true + '&refresh_id=' + refresh : '';
    let url = '/api/cache/preview/outfit?parent_iid=' + item.internal_id + '&';

    const speciesName = item.name.replace(/Day Y\d+ Mini Mystery Capsule/i, '').trim();
    const speciesID = getSpeciesId(speciesName);
    if (speciesID) url += `petId=${speciesID}&`;

    outfitList.forEach((iid) => {
      url += `iid[]=${iid}&`;
    });

    return url + (isRefresh || cacheHash);
  }, [item, outfitList, refresh]);

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
        <Text>{t('ItemPage.outfit-preview')}</Text>
      </Flex>
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
        <Text fontSize="xs">
          {t('ItemPage.powered-by')}{' '}
          <Link href="https://impress.openneo.net/" isExternal fontWeight="bold">
            Dress To Impress <ExternalLinkIcon mx="1px" verticalAlign="baseline" />
          </Link>
        </Text>
      </Box>
    </Flex>
  );
};

export default ItemOutfit;
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
    <AspectRatio ratio={1}>
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
