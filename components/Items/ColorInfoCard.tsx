import {
  Box,
  Button,
  Center,
  Flex,
  Icon,
  IconButton,
  Link,
  Text,
  useToast,
} from '@chakra-ui/react';
import React from 'react';
import { AiFillEyeInvisible } from 'react-icons/ai';
import { FullItemColors } from '../../types';
import { useTranslations } from 'next-intl';
import { BiCopy, BiSearch } from 'react-icons/bi';
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
  const t = useTranslations();
  const toast = useToast();
  const [showMore, setShowMore] = React.useState(false);
  const { colors } = props;
  const color = colors.vibrant.rgb;

  const isInvisible = Object.values(colors).every(
    (color) => color.population === 0 && color.hex === '#FFFFFF'
  );

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);

    window.umami?.track('color-info-card', { action: 'copy text' });

    toast({
      title: t('Layout.copied-to-clipboard'),
      description: text,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const toggleShowMore = () => {
    setShowMore(!showMore);
    window.umami?.track('color-info-card', { action: showMore ? 'show less' : 'show more' });
  };

  return (
    <Flex borderTopRadius="md" overflow="hidden" flexFlow="column" boxShadow="sm">
      <Box
        p={2}
        textAlign="center"
        fontWeight="bold"
        bg={`rgba(${color[0]}, ${color[1]}, ${color[2]}, .6)`}
      >
        {t('ItemPage.color-palette')}
      </Box>
      <Flex
        p={3}
        bg="gray.600"
        boxShadow="md"
        gap={4}
        flexWrap="wrap"
        justifyContent="center"
        alignItems="center"
        h="100%"
        borderBottomRadius="md"
      >
        {!isInvisible && (
          <Flex flexFlow={'column'} w="100%" gap={2} alignItems={'center'}>
            {[...colorKeysOrder].splice(0, showMore ? colorKeysOrder.length : 3).map((key) => (
              <Flex
                h="40px"
                w="100%"
                maxW="250px"
                py={1}
                px={3}
                bg={colors[key].hex}
                borderRadius="md"
                justifyContent="space-between"
              >
                <Flex flexFlow={'column'}>
                  <Text fontSize="xs" fontWeight="bold" textShadow="0px 0px 4px #000">
                    {colors[key].type}
                  </Text>
                  <Text fontSize="0.6rem" textShadow="0px 0px 4px #000">
                    {colors[key].hex}
                  </Text>
                </Flex>
                <Flex justifyContent={'center'} alignItems="center" gap={2}>
                  <IconButton
                    as={Link}
                    rel="nofollow"
                    href={'/search?s=' + encodeURIComponent(colors[key].hex)}
                    icon={<BiSearch />}
                    aria-label="Search Hex"
                    size="xs"
                    boxShadow={'lg'}
                  />
                  <IconButton
                    icon={<BiCopy />}
                    aria-label="Copy Hex"
                    size="xs"
                    boxShadow={'lg'}
                    onClick={() => handleCopy(colors[key].hex)}
                  />
                </Flex>
              </Flex>
            ))}
          </Flex>
        )}
        {!isInvisible && (
          <Button size="xs" onClick={toggleShowMore}>
            {showMore ? t('ItemPage.show-less') : t('ItemPage.show-more')}
          </Button>
        )}
        {isInvisible && (
          <Center flexFlow="column" gap={1}>
            <Icon as={AiFillEyeInvisible} boxSize="32px" opacity={0.4} />
            <Text fontSize="xs" color="gray.200">
              {t('ItemPage.invisible-item')}
            </Text>
          </Center>
        )}
      </Flex>
    </Flex>
  );
};

export default ColorInfoCard;
