import { Box, Center, Flex, Heading, Link, Separator, Text } from '@chakra-ui/react';
import ItemCard from '@components/Items/ItemCard';
import Image from '@components/Utils/Image';
import MainLink from '@components/Utils/MainLink';
import { SkeletonImage } from '@components/Utils/SkeletonImage';
import { allSpecies, getSpeciesId } from '@utils/pet-utils';
import Color from 'color';
import type { ItemData } from '@types';
import type { OutfitPageLabels } from './buildOutfitPageProps';
import { OutfitSpeciesSelect } from './OutfitSpeciesSelect';

const rgb = Color('#94aefa').rgb().array();

type OutfitPageContentProps = {
  outfits: Record<string, ItemData[]>;
  species: string;
  labels: OutfitPageLabels;
};

export function OutfitPageContent({ outfits, species, labels }: OutfitPageContentProps) {
  return (
    <>
      <Box
        position="absolute"
        h="650px"
        left="0"
        width="100%"
        bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${rgb[0]},${rgb[1]},${rgb[2]},.7) 70%)`}
        zIndex={-1}
      />
      <Center my={6} flexFlow="column" gap={2}>
        <OutfitNavArrows species={species} />
        <Image
          borderRadius="md"
          boxShadow="md"
          width={600}
          height={200}
          quality={90}
          w="100%"
          maxW="600px"
          h="auto"
          priority
          src="https://images.neopets.com/ncmall/shopkeepers/cashshop_fashionshow.png"
          alt={labels.exclusiveClothesGuide}
        />
        <Heading as="h1" fontWeight="bold" textAlign="center" color="white">
          {labels.exclusiveSpeciesClothes}
        </Heading>
        <Text maxW="900px" textAlign="center">
          {labels.description}
        </Text>
        <OutfitSpeciesSelect species={species} selectSpeciesLabel={labels.selectSpecies} />
      </Center>
      <Separator my={3} />
      <Flex flexFlow="column" alignItems="center" gap={7} mt={5}>
        {Object.entries(outfits).map(([line, outfit]) => (
          <Flex
            flexFlow="column"
            gap={3}
            bg="blackAlpha.600"
            p={2}
            borderRadius="lg"
            key={line}
            w={{ base: '100%', lg: '900px' }}
            alignItems="center"
            py={5}
          >
            <Text as="h2" textTransform="capitalize" fontWeight="bold" mb={3} fontSize="lg">
              {line}
            </Text>
            <Flex
              gap={3}
              flexFlow={{ base: 'column', md: 'row' }}
              justifyContent="center"
              alignItems="center"
            >
              <Flex flexFlow="column">
                <SkeletonImage
                  key={line}
                  url={getPreviewUrl(outfit)}
                  loadkey={line}
                  width={300}
                  height={300}
                />
              </Flex>
              <Flex flexWrap="wrap" justifyContent="center" gap={2} flex={1}>
                {outfit.map((item) => (
                  <ItemCard uniqueID={`outfit-${line}`} key={item.internal_id} item={item} />
                ))}
              </Flex>
            </Flex>
          </Flex>
        ))}
        <Text fontSize="xs" textAlign="center" color="whiteAlpha.500">
          {labels.previewCredit}
        </Text>
      </Flex>
    </>
  );
}

function getPreviewUrl(items: ItemData[]) {
  let url = '/api/cache/preview/outfit?';
  items.forEach((item) => {
    url += `iid[]=${item.internal_id}&`;
  });
  return url;
}

function OutfitNavArrows({ species }: { species: string }) {
  const speciesId = getSpeciesId(species);
  if (!speciesId) return null;

  const nextSpecies = allSpecies[speciesId + 1] ?? allSpecies[1];
  const prevSpecies = allSpecies[speciesId - 1] ?? allSpecies[56];

  return (
    <Center gap={8} fontSize="xs">
      <Link asChild>
        <MainLink href={`/hub/outfits/${prevSpecies.toLowerCase()}`} prefetch={false}>
          ← {prevSpecies}
        </MainLink>
      </Link>
      <Link asChild>
        <MainLink href={`/hub/outfits/${nextSpecies.toLowerCase()}`} prefetch={false}>
          {nextSpecies} →
        </MainLink>
      </Link>
    </Center>
  );
}
