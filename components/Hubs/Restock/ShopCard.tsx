import { Badge, Flex, Link, Text, Box, HStack } from '@chakra-ui/react';
import Color from 'color';
import MainLink from '@components/Utils/MainLink';
import { ShopInfo } from '../../../types';
import { slugify } from '../../../utils/utils';
import NextImage from 'next/image';

type Props = {
  shop: ShopInfo;
};

const ShopCard = (props: Props) => {
  const { shop } = props;
  const color = Color(shop.color);
  const rgb = color.rgb().array();

  return (
    <Flex
      bg="gray.700"
      //
      pb={{ base: 2, md: 3 }}
      borderRadius="md"
      overflow="visible"
      minH="100px"
      maxWidth="325px"
      w="100%"
      gap={3}
      // ml="40px"
      position={'relative'}
      bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]},.50) 0%)`}
      // mt={'75px'}
      boxShadow={'sm'}
      pt={'40px'}
      flexFlow={'column'}
    >
      <Box mt="-40px">
        <Link asChild _hover={{ textDecoration: 'none' }}>
          <MainLink href={`/restock/${slugify(shop.name)}`} prefetch={false}>
            <NextImage
              width={325}
              height={108.33}
              src={`https://images.neopets.com/shopkeepers/w${shop.id}.gif`}
              alt={`${shop.name} thumbnail`}
              style={{ borderRadius: '0.375rem' }}
            />
          </MainLink>
        </Link>
      </Box>
      <Flex flexFlow={'column'} gap={3} justifyContent="center" flex="1" px={{ base: 2, md: 3 }}>
        <Link asChild _hover={{ textDecoration: 'none' }} display="block">
          <MainLink href={`/restock/${slugify(shop.name)}`} prefetch={false}>
            <Text textAlign={'center'} fontSize="xl" fontWeight={'bold'}>
              {shop.name}
            </Text>
          </MainLink>
        </Link>
        <HStack justifyContent={'center'} gap={2}>
          <Badge>{shop.category}</Badge>
          {shop.difficulty != 'Medium' && (
            <Badge
              colorPalette={
                shop.difficulty === 'Beginner'
                  ? 'green'
                  : shop.difficulty === 'Advanced'
                    ? 'red'
                    : undefined
              }
            >
              {shop.difficulty}
            </Badge>
          )}
        </HStack>
      </Flex>
    </Flex>
  );
};

export default ShopCard;
