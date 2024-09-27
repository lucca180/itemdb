import { Box, Center, Flex, Icon, Link, SimpleGrid, Text } from '@chakra-ui/react';
import React from 'react';
import { AiFillEyeInvisible } from 'react-icons/ai';
import { FullItemColors } from '../../types';
import { useTranslations } from 'next-intl';
type Props = {
  colors: FullItemColors;
};

const colorKeysOrder: (keyof FullItemColors)[] = [
  'vibrant',
  'lightvibrant',
  'darkvibrant',
  'muted',
  'lightmuted',
  'darkmuted',
];

const ColorInfoCard = (props: Props) => {
  const t = useTranslations('ItemPage');
  const { colors } = props;
  const color = colors.vibrant.rgb;

  const isInvisible = Object.values(colors).every(
    (color) => color.population === 0 && color.hex === '#FFFFFF',
  );

  return (
    <Flex
      // flex={1}
      // height='100%'
      borderTopRadius="md"
      overflow="hidden"
      flexFlow="column"
      boxShadow="sm"
    >
      <Box
        p={2}
        textAlign="center"
        fontWeight="bold"
        bg={`rgba(${color[0]}, ${color[1]}, ${color[2]}, .6)`}
      >
        {t('color-palette')}
      </Box>
      <Flex
        p={3}
        bg="gray.600"
        boxShadow="md"
        gap={4}
        // textAlign='center'
        flexWrap="wrap"
        justifyContent="center"
        alignItems="center"
        h="100%"
        borderBottomRadius="md"
      >
        {!isInvisible && (
          <SimpleGrid columns={3} gap={3}>
            {colorKeysOrder.map((key) => (
              <Link
                key={colors[key].type}
                href={'/search?s=' + encodeURIComponent(colors[key].hex)}
              >
                <Flex
                  minW="50px"
                  h="50px"
                  p={1}
                  bg={colors[key].hex}
                  justifyContent="center"
                  alignItems="center"
                  flexFlow="column"
                >
                  <Text fontSize="xs" textShadow="0px 0px 4px #000">
                    {colors[key].hex}
                  </Text>
                  <Text fontSize="0.6rem" fontWeight="bold" textShadow="0px 0px 4px #000">
                    {colors[key].type}
                  </Text>
                </Flex>
              </Link>
            ))}
          </SimpleGrid>
        )}
        {isInvisible && (
          <Center flexFlow="column" gap={1}>
            <Icon as={AiFillEyeInvisible} boxSize="32px" opacity={0.4} />
            <Text fontSize="xs" color="gray.200">
              {t('invisible-item')}
            </Text>
          </Center>
        )}
      </Flex>
    </Flex>
  );
};

export default ColorInfoCard;
