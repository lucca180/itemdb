import { Box, Flex, IconButton, Link, Text } from '@chakra-ui/react';
import CardBase from '@components/Card/CardBase';
import { useMemo, useState } from 'react';
import { CdnImage } from '@components/Utils/CdnImage';
import { ItemData } from '@types';
import { ExternalLinkIcon } from '@utils/theme/chakraIcons';
import { useTranslations } from 'next-intl';
import { useAuth } from '@utils/auth';
import { FaRotateRight } from 'react-icons/fa6';
import { getSpeciesId } from '@utils/pet-utils';
import { outfitPreviewSources, previewSourcesForceApi } from '@utils/cdnPreview';

type Props = {
  item: ItemData;
  outfitList: number[];
};

const ItemOutfit = (props: Props) => {
  const t = useTranslations();
  const [refresh, setRefresh] = useState(0);
  const { user } = useAuth();
  const { outfitList, item } = props;
  const color = item.color.rgb;

  const refreshPreview = () => {
    setRefresh((prev) => prev + 1);
  };

  const previewSources = useMemo(() => {
    const speciesName = item.name.replace(/Day Y\d+ Mini Mystery Capsule/i, '').trim();
    const speciesId = getSpeciesId(speciesName);
    const base = outfitPreviewSources(
      outfitList.map((iid) => ({ internal_id: iid })),
      speciesId
    );
    const api = `${base.api}parent_iid=${item.internal_id}`;
    const hashed = {
      cdn: item.cacheHash ? `${base.cdn}?hash=${item.cacheHash}` : base.cdn,
      api: item.cacheHash ? `${api}&hash=${item.cacheHash}` : api,
    };
    return refresh ? previewSourcesForceApi(hashed.api, refresh) : hashed;
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
          user && !user?.banned
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
        <Box aspectRatio={1} position="relative" w="100%" minW={300}>
          <CdnImage
            key={previewSources.cdn}
            cdnSrc={previewSources.cdn}
            apiSrc={previewSources.api}
            alt="Item Preview"
            unoptimized
            fill
            sizes="300px"
            priority
            loading="eager"
            fetchPriority="high"
            style={{ objectFit: 'contain' }}
          />
        </Box>
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
