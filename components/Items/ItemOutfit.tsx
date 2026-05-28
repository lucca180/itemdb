import { Box, Flex, IconButton, Link, Skeleton, Text } from '@chakra-ui/react';
import CardBase from '@components/Card/CardBase';
import { useMemo, useState } from 'react';
import Image from 'next/image';
import { ItemData } from '@types';
import { ExternalLinkIcon } from '@utils/theme/chakraIcons';
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
  const [loadedPreviewUrl, setLoadedPreviewUrl] = useState('');
  const [refresh, setRefresh] = useState(0);
  const { user } = useAuth();
  const { outfitList, item } = props;
  const color = item.color.rgb;

  const refreshPreview = () => {
    setRefresh((prev) => prev + 1);
    setLoadedPreviewUrl('');
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
    <CardBase
      title={t('ItemPage.outfit-preview')}
      color={color}
      noPadding
      chakraWrapper={{ width: 'fit-content', borderRadius: 'md', w: '100%' }}
      chakra={{ h: 'auto' }}
    >
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

      <Box p={1} textAlign="center" bg={`rgba(${color[0]}, ${color[1]}, ${color[2]}, .6)`}>
        <Text fontSize="xs">
          {t('ItemPage.powered-by')}{' '}
          <Link
            href="https://impress.openneo.net/"
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

export default ItemOutfit;
