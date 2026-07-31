import { Box, Flex, Text } from '@chakra-ui/react';
import Image from '@components/Utils/Image';
import MainLink from '@components/Utils/MainLink';
import type { RainbowPoolComboTile } from '@utils/petColorTool';

type ComboTileProps = {
  combo: RainbowPoolComboTile;
  titleMode?: 'color' | 'species' | 'full';
  releasedLabel?: string;
};

export function ComboTile({ combo, titleMode = 'full', releasedLabel }: ComboTileProps) {
  const title =
    titleMode === 'color'
      ? combo.colorName
      : titleMode === 'species'
        ? combo.speciesName
        : `${combo.colorName} ${combo.speciesName}`;

  return (
    <MainLink href={combo.href} style={{ textDecoration: 'none' }}>
      <Flex
        flexFlow="column"
        align="center"
        gap={2}
        p={3}
        bg="blackAlpha.400"
        borderRadius="lg"
        h="100%"
        transition="background 0.15s, transform 0.15s"
        _hover={{ bg: 'blackAlpha.600', transform: 'translateY(-2px)' }}
      >
        <Box
          w="120px"
          h="120px"
          borderRadius="md"
          bg="blackAlpha.500"
          overflow="hidden"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Image
            src={combo.previewUrl}
            alt={title}
            width={120}
            height={120}
            unoptimized
            style={{ objectFit: 'contain' }}
          />
        </Box>
        <Text fontWeight="semibold" fontSize="sm" textAlign="center">
          {title}
        </Text>
        {releasedLabel && (
          <Text fontSize="xs" color="whiteAlpha.600">
            {releasedLabel}
          </Text>
        )}
      </Flex>
    </MainLink>
  );
}
