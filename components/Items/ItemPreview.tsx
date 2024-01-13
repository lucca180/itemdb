import { AspectRatio, Box, Flex, Link, Skeleton, Text } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { ItemData } from '../../types';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { useTranslations } from 'next-intl';

type Props = {
  item: ItemData;
  isLoading?: boolean;
};

const ItemPreview = (props: Props) => {
  const t = useTranslations();
  const [isLoaded, setIsLoaded] = useState(false);
  const { item, isLoading } = props;
  const color = item.color.rgb;

  useEffect(() => {
    if (isLoading) setIsLoaded(false);
  }, [isLoading]);

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
        // p={3}
        position="relative"
        bg="gray.600"
        boxShadow="md"
        gap={4}
        flexWrap="wrap"
        justifyContent="center"
        alignItems="center"
        h="100%"
      >
        <Skeleton minW={300} minH={300} h="100%" w="100%" isLoaded={isLoaded}>
          <AspectRatio ratio={1}>
            <Image
              src={'/api/cache/preview/' + item.image_id + '.png'}
              alt="Item Preview"
              unoptimized
              fill
              priority
              onLoadStart={() => setIsLoaded(false)}
              onLoad={() => setIsLoaded(true)}
            />
          </AspectRatio>
        </Skeleton>
      </Flex>
      <Box p={1} textAlign="center" bg={`rgba(${color[0]}, ${color[1]}, ${color[2]}, .6)`}>
        <Text fontSize="small">
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
