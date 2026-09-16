import { Box, Flex, Image, Link, Text } from '@chakra-ui/react';
import MainLink from '@components/Utils/MainLink';
import type { OutfitPageLabels } from './buildOutfitPageProps';

const RAINBOW_POOL_ICON = '/icons/effects-color.png';
const STYLING_STUDIO_ICON =
  'https://images.neopets.com/themes/h5/basic/images/stylingstudio-icon.png';

type OutfitExploreLinksProps = {
  labels: OutfitPageLabels;
};

/** Discreet Rainbow Pool / Pet Styles cross-links shown right under the outfits page lede. */
export function OutfitExploreLinks({ labels }: OutfitExploreLinksProps) {
  const targets = [
    {
      id: 'rainbow-pool',
      href: labels.rainbowPoolHref,
      icon: RAINBOW_POOL_ICON,
      title: labels.rainbowPoolCardTitle,
    },
    {
      id: 'pet-styles',
      href: labels.petStylesHref,
      icon: STYLING_STUDIO_ICON,
      title: labels.petStylesCardTitle,
    },
  ];

  return (
    <Flex flexFlow="column" alignItems="center" gap={2}>
      <Text fontSize="sm" color="whiteAlpha.700" textAlign="center">
        {labels.exploreLinksCta}
      </Text>
      <Flex gap={2} flexWrap="wrap" justify="center">
        {targets.map((target) => (
          <Link key={target.id} asChild>
            <MainLink href={target.href} trackEvent="outfits-hub" trackEventLabel={target.id}>
              <Flex
                align="center"
                gap={2}
                px={2.5}
                py={1.5}
                borderRadius="md"
                bg="blackAlpha.400"
                minW="150px"
                _hover={{ bg: 'blackAlpha.600' }}
                transition="background 0.15s"
              >
                <Flex
                  align="center"
                  justify="center"
                  bg="blackAlpha.300"
                  borderRadius="sm"
                  flex="0 0 26px"
                  h="26px"
                >
                  <Image src={target.icon} alt="" h="18px" w="18px" objectFit="contain" />
                </Flex>
                <Text fontSize="xs" fontWeight="semibold" lineHeight="short">
                  {target.title}
                </Text>
                <Box
                  aria-hidden
                  color="gray.400"
                  flexShrink={0}
                  fontSize="lg"
                  lineHeight="1"
                  ml="auto"
                >
                  ›
                </Box>
              </Flex>
            </MainLink>
          </Link>
        ))}
      </Flex>
    </Flex>
  );
}
