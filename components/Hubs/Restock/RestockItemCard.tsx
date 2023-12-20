import { Badge, Flex, Link, Text, Image, HStack } from '@chakra-ui/react';
import Color from 'color';
import NextLink from 'next/link';
import { ItemData, RestockSession } from '../../../types';
import { msIntervalFormated } from '../../../utils/utils';
import { differenceInMilliseconds, format } from 'date-fns';

type Props = {
  item: ItemData;
  clickData: RestockSession['clicks'][0];
  restockItem: RestockSession['items'][0];
  disablePrefetch?: boolean;
};

const intl = new Intl.NumberFormat();

const RestockItem = (props: Props) => {
  const { item, clickData, restockItem, disablePrefetch } = props;
  const rgb = Color(item.color.hex).rgb().array();

  const boughtTime = differenceInMilliseconds(
    new Date(clickData.buy_timestamp ?? 0),
    new Date(restockItem.timestamp)
  );

  return (
    <Link
      as={NextLink}
      prefetch={!disablePrefetch ? undefined : false}
      href={'/item/' + (item.slug ?? item.internal_id)}
      _hover={{ textDecoration: 'none' }}
    >
      <Flex
        bg="gray.700"
        p={2}
        bgGradient={`linear(to-r, rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.5), rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.35) 99%)`}
        borderRadius={'md'}
        boxShadow={'md'}
        gap={2}
      >
        <Image
          src={item.image}
          alt={item.name}
          boxSize="50px"
          objectFit="cover"
          borderRadius="md"
        />
        <Flex alignItems={'flex-start'} gap={1} flexFlow={'column'} justifyContent={'center'}>
          <HStack>
            <Text>{item.name}</Text>
            {item.price.value && <Badge>{intl.format(item.price.value)} NP</Badge>}
          </HStack>
          <Text fontSize={'xs'}>
            Bought in <b>{msIntervalFormated(boughtTime, true, 2)}</b> at{' '}
            {format(clickData.buy_timestamp ?? 0, 'PPPp')}
          </Text>
        </Flex>
      </Flex>
    </Link>
  );
};

export default RestockItem;
