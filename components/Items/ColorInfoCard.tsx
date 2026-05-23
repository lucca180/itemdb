import { Button, Center, Flex, Icon, IconButton, Link, Text } from '@chakra-ui/react';
import CardBase from '@components/Card/CardBase';
import { useToast } from '@utils/styling/toast';
import React from 'react';
import { AiFillEyeInvisible } from 'react-icons/ai';
import { FullItemColors } from '../../types';
import { useTranslations } from 'next-intl';
import { BiCopy, BiSearch } from 'react-icons/bi';
import Color from 'color';
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
    <CardBase
      title={t('ItemPage.color-palette')}
      color={color}
      chakra={{
        display: 'flex',
        gap: 4,
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {!isInvisible && (
        <Flex flexFlow={'column'} w="100%" gap={2} alignItems={'center'}>
          {[...colorKeysOrder].splice(0, showMore ? colorKeysOrder.length : 3).map((key) => {
            const isLight = Color(colors[key].hex).isLight();
            return (
              <Flex
                h="40px"
                w="100%"
                maxW="250px"
                py={1}
                px={3}
                key={key}
                bg={colors[key].hex}
                borderRadius="md"
                justifyContent="space-between"
                color={isLight ? 'blackAlpha.800' : 'whiteAlpha.800'}
              >
                <Flex flexFlow={'column'}>
                  <Text fontSize="xs" fontWeight="bold">
                    {colors[key].type}
                  </Text>
                  <Text fontSize="0.6rem">{colors[key].hex}</Text>
                </Flex>
                <Flex justifyContent={'center'} alignItems="center" gap={2}>
                  <IconButton
                    asChild
                    aria-label="Search Hex"
                    variant="subtle"
                    size="xs"
                    color={isLight ? 'blackAlpha.800' : 'whiteAlpha.800'}
                    colorPalette={isLight ? 'blackAlpha' : 'whiteAlpha'}
                    minW={6}
                    h={6}
                    css={{
                      '& :where(svg)': {
                        width: '12px',
                        height: '12px',
                      },
                    }}
                  >
                    <Link rel="nofollow" href={'/search?s=' + encodeURIComponent(colors[key].hex)}>
                      <BiSearch />
                    </Link>
                  </IconButton>
                  <IconButton
                    aria-label="Copy Hex"
                    size="xs"
                    color={isLight ? 'blackAlpha.800' : 'whiteAlpha.800'}
                    colorPalette={isLight ? 'blackAlpha' : 'whiteAlpha'}
                    variant="subtle"
                    onClick={() => handleCopy(colors[key].hex)}
                    minW={6}
                    h={6}
                    fontSize="1em"
                    css={{
                      '& :where(svg)': {
                        width: '12px',
                        height: '12px',
                      },
                    }}
                  >
                    <BiCopy fontSize={'1em'} />
                  </IconButton>
                </Flex>
              </Flex>
            );
          })}
        </Flex>
      )}
      {!isInvisible && (
        <Button size="xs" colorPalette="whiteAlpha" variant="subtle" onClick={toggleShowMore}>
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
    </CardBase>
  );
};

export default ColorInfoCard;
