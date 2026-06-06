import { Badge, Box, Flex, Heading, Stack, Text } from '@chakra-ui/react';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@i18n/navigation';
import { ItemBreadcrumb } from '@components/Breadcrumbs/ItemBreadcrumb';
import type { ItemData, UserList } from '@types';

type ItemHeaderProps = {
  item: ItemData;
  lists?: UserList[];
};

export async function ItemHeader({ item, lists }: ItemHeaderProps) {
  const t = await getTranslations();
  const color = item.color.rgb ?? [255, 255, 255];

  return (
    <Box>
      <Box
        position="absolute"
        h="45vh"
        left="0"
        width="100%"
        bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${color[0]},${color[1]}, ${color[2]},.5) 80%)`}
        zIndex={-1}
      />
      <Box pt={2}>
        <ItemBreadcrumb item={item} officialLists={lists} useAppDir />
      </Box>
      <Flex gap={{ base: 4, md: 8 }} pt={4} alignItems="center">
        <Flex
          position="relative"
          p={2}
          bg={`rgba(${color[0]},${color[1]}, ${color[2]},.4)`}
          borderRadius="md"
          flexFlow="column"
          justifyContent="center"
          gap={2}
          alignItems="center"
          textAlign="center"
          flex="0 0 auto"
          minW="100px"
          minH="100px"
        >
          <Image src={item.image} width={80} height={80} alt="" unoptimized />
        </Flex>
        <Box>
          <Stack direction="row" mb={1} wrap="wrap" gap={0.5}>
            <Badge borderRadius="md" asChild>
              <Link href={`/search?s=&category[]=${item.category ?? 'Unknown'}`} prefetch={false}>
                {item.category ?? '???'}
              </Link>
            </Badge>
            {item.type === 'np' && (
              <Badge colorPalette="green" borderRadius="md" asChild>
                <Link href="/search?s=&type[]=np" prefetch={false}>
                  NP
                </Link>
              </Badge>
            )}
            {item.type === 'nc' && (
              <Badge colorPalette="purple" borderRadius="md" asChild>
                <Link href="/search?s=&type[]=nc" prefetch={false}>
                  NC
                </Link>
              </Badge>
            )}
            {item.type === 'pb' && (
              <Badge colorPalette="yellow" borderRadius="md" asChild>
                <Link href="/search?s=&type[]=pb" prefetch={false}>
                  PB
                </Link>
              </Badge>
            )}
            {item.isWearable && (
              <Badge colorPalette="blue" borderRadius="md" asChild>
                <Link href="/search?s=&type[]=wearable" prefetch={false}>
                  {t('General.wearable')}
                </Link>
              </Badge>
            )}
            {item.isNeohome && (
              <Badge colorPalette="cyan" borderRadius="md" asChild>
                <Link href="/search?s=&type[]=neohome" prefetch={false}>
                  {t('General.neohome')}
                </Link>
              </Badge>
            )}
            {item.isBD && (
              <Badge colorPalette="red" borderRadius="md" asChild>
                <Link href="/search?s=&type[]=battledome" prefetch={false}>
                  {t('General.battledome')}
                </Link>
              </Badge>
            )}
            {item.useTypes.canEat === 'true' && (
              <Badge colorPalette="orange" borderRadius="md" asChild>
                <Link href="/search?s=&type[]=canEat" prefetch={false}>
                  {t('General.edible')}
                </Link>
              </Badge>
            )}
            {item.useTypes.canRead === 'true' && (
              <Badge colorPalette="orange" borderRadius="md" asChild>
                <Link href="/search?s=&type[]=canRead" prefetch={false}>
                  {t('General.readable')}
                </Link>
              </Badge>
            )}
            {item.useTypes.canPlay === 'true' && (
              <Badge colorPalette="orange" borderRadius="md" asChild>
                <Link href="/search?s=&type[]=canPlay" prefetch={false}>
                  {t('General.playable')}
                </Link>
              </Badge>
            )}
          </Stack>
          <Heading as="h1" size={{ base: 'lg', md: undefined }} fontWeight="bold">
            {item.name}
          </Heading>
          <Text fontSize={{ base: 'sm', md: 'inherit' }} as="h2">
            {item.description}
          </Text>
        </Box>
      </Flex>
    </Box>
  );
}
