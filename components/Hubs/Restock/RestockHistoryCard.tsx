import { Flex, Link, Image, Badge, HStack, Text } from '@chakra-ui/react';
import { ItemData, ItemRestockData } from '../../../types';
import NextLink from 'next/link';
import Color from 'color';
import { useFormatter, useTranslations } from 'next-intl';

type Props = {
  restock: ItemRestockData & { item: ItemData };
};

const RestockHistoryCard = (props: Props) => {
  const t = useTranslations();
  const format = useFormatter();

  const { restock } = props;
  const { item } = restock;
  const rgb = Color(item.color.hex).rgb().array();

  return (
    <Link
      as={NextLink}
      prefetch={false}
      href={'/item/' + (item.slug ?? item.internal_id)}
      _hover={{ textDecoration: 'none' }}
    >
      <Flex
        bg="gray.700"
        p={2}
        bgGradient={`linear(to-r, rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.5), rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.35) 99%)`}
        borderRadius={'md'}
        boxShadow={'md'}
        alignItems={'center'}
        gap={2}
        w="400px"
        h="100%"
        minH="80px"
      >
        <Image
          src={item.image}
          alt={item.name}
          boxSize="50px"
          objectFit="cover"
          borderRadius="md"
        />
        <Flex alignItems={'flex-start'} gap={1} flexFlow={'column'} justifyContent={'center'}>
          <HStack gap={1}>
            <Text fontSize="sm">{item.name}</Text>
            {item.rarity && (
              <Badge fontSize="xs" textTransform={'none'}>
                r{item.rarity}
              </Badge>
            )}
            {item.price.value && <Badge fontSize="xs">{format.number(item.price.value)} NP</Badge>}
          </HStack>
          <Text fontSize="xs">
            {t('Restock.stocked-at-date', {
              date: format.dateTime(new Date(restock.addedAt), {
                dateStyle: 'long',
                timeStyle: 'short',
              }),
            })}
          </Text>
        </Flex>
      </Flex>
    </Link>
  );
};

export default RestockHistoryCard;
