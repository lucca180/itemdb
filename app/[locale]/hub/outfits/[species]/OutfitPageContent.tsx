import { Box, Center, Flex, Heading, Link, Separator, SimpleGrid, Text } from '@chakra-ui/react';
import Image from '@components/Utils/Image';
import MainLink from '@components/Utils/MainLink';
import { allSpecies, getSpeciesId } from '@utils/pet-utils';
import Color from 'color';
import type { ItemData } from '@types';
import type { OutfitPageLabels } from './buildOutfitPageProps';
import { OutfitCard } from './OutfitCard';
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
        bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0, rgba(${rgb[0]},${rgb[1]},${rgb[2]},.7) 70%)`}
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
        <Text maxW="900px" textAlign="center" color="whiteAlpha.800">
          {labels.paintCta}
        </Text>
        <OutfitSpeciesSelect species={species} selectSpeciesLabel={labels.selectSpecies} />
      </Center>
      <Separator my={3} />
      <Flex flexFlow="column" alignItems="center" gap={5} mt={5} px={2}>
        <SimpleGrid
          columns={{ base: 1, sm: 2, md: 3, xl: 4 }}
          gap={4}
          w="100%"
          maxW="1200px"
          alignItems="start"
        >
          {Object.entries(outfits).map(([line, outfit]) => (
            <OutfitCard
              key={line}
              line={line}
              outfit={outfit}
              speciesId={getSpeciesId(species)}
              showItemsLabel={labels.showItems}
              hideItemsLabel={labels.hideItems}
            />
          ))}
        </SimpleGrid>
        <Flex gap={3} flexWrap="wrap" fontSize="sm" justifyContent="center">
          <Link asChild color="teal.200">
            <MainLink
              href={labels.rainbowPoolHref}
              trackEvent="related-link"
              trackEventLabel="rainbow-pool"
            >
              {labels.allColoursOfSpecies}
            </MainLink>
          </Link>
        </Flex>
        <Text fontSize="xs" textAlign="center" color="whiteAlpha.500">
          {labels.previewCredit}
        </Text>
      </Flex>
    </>
  );
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
