import { Flex, Link, Text, Image } from '@chakra-ui/react';
import icon from '../../../public/logo_icon.svg';
import NextImage from 'next/image';
import Color from 'color';
import NextLink from 'next/link';

type Props = {
  color?: string;
  coverURL?: string;
  link: string;
  title?: string;
  description?: string;
  footerText?: string;
};

const SearchCard = (props: Props) => {
  const { coverURL, link, title, description, footerText: rarityRange } = props;
  const color = Color(props.color || '#4A5568');
  const rgb = color.rgb().array();

  return (
    <Flex
      bg="gray.700"
      p={{ base: 2, md: 3 }}
      borderRadius="md"
      overflow="visible"
      minH="100px"
      maxWidth="325px"
      w={{ base: 'auto', sm: '375px' }}
      gap={3}
      ml="40px"
      bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]},.75) 0%)`}
    >
      <Link as={NextLink} href={link} _hover={{ textDecoration: 'none' }}>
        <Flex
          position="relative"
          w={{ base: '100px', sm: '100px' }}
          h={{ base: '100px', sm: '100px' }}
          ml="-50px"
          bg="gray.700"
          bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, .85) 0%)`}
          flex="0 0 auto"
          borderRadius="md"
          overflow="hidden"
          justifyContent="center"
          alignItems="center"
        >
          {!coverURL && (
            <NextImage src={icon} width={75} style={{ opacity: 0.85 }} alt={'List Cover'} />
          )}

          {coverURL && (
            <Image
              src={coverURL}
              w={{ base: '80px', sm: '80px' }}
              h={{ base: '80px', sm: '80px' }}
              alt={'List Cover'}
              objectFit="cover"
              borderRadius="md"
            />
          )}
        </Flex>
      </Link>
      <Flex flexFlow="column" gap={2}>
        <Text
          fontWeight="bold"
          noOfLines={2}
          color={color.isLight() ? 'blackAlpha.800' : undefined}
        >
          <Link as={NextLink} href={link}>
            {title}
          </Link>
        </Text>
        <Text
          fontSize="xs"
          color={color.isLight() ? 'blackAlpha.700' : undefined}
          flex={1}
          noOfLines={4}
        >
          {description}
        </Text>
        <Flex gap={1} flexWrap="wrap">
          <Text
            fontWeight="bold"
            fontSize="xs"
            noOfLines={2}
            color={color.isLight() ? 'blackAlpha.700' : undefined}
          >
            {rarityRange}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default SearchCard;
