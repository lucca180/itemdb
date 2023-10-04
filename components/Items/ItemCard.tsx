import { Badge, Box, Icon, Skeleton, Text, Link, Tooltip, useMediaQuery } from '@chakra-ui/react';
import React from 'react';
import Image from 'next/image';
import { ItemData } from '../../types';
import NextLink from 'next/link';
import { AiFillInfoCircle, AiFillWarning } from 'react-icons/ai';
import ItemCtxMenu, { CtxTrigger } from '../Modal/ItemCtxMenu';
import { rarityToCCPoints } from '../../utils/utils';

export type ItemProps = {
  item?: ItemData;
  isLoading?: boolean;
  selected?: boolean;
  disableLink?: boolean;
  capValue?: number | null;
  quantity?: number;
  onSelect?: () => void;
  onListAction?: (item: ItemData, action: 'move' | 'delete') => any;
  style?: React.CSSProperties;
  small?: boolean;
  odds?: number;
  isLE?: boolean;
  sortType?: string;
};

const intl = new Intl.NumberFormat();

const ItemCardBase = (props: ItemProps) => {
  const {
    item,
    isLoading,
    selected,
    disableLink,
    capValue,
    quantity,
    small,
    odds,
    isLE,
    onListAction,
    sortType,
  } = props;
  const [isMobile] = useMediaQuery('(hover: none)');

  const color = item?.color.rgb;

  if (!item || isLoading || !color)
    return (
      <Link as={'a'} _hover={{ textDecoration: 'none' }} pointerEvents="none" style={props.style}>
        <Box
          w={{ base: 100, md: small ? 100 : 150 }}
          py={{ base: 2, md: small ? 2 : 4 }}
          px={2}
          bg="gray.700"
          h="100%"
          borderRadius="md"
          display="flex"
          flexFlow="column"
          justifyContent="center"
          alignItems="center"
          boxShadow="sm"
          textAlign="center"
          cursor="pointer"
        >
          <Skeleton w="80px" h="80px" />
          <Skeleton w="80px" h="12px" mt={2} />
        </Box>
      </Link>
    );

  return (
    <>
      <ItemCtxMenu item={item} onSelect={props.onSelect} onListAction={onListAction} />
      <CtxTrigger
        id={item.internal_id.toString()}
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        disableWhileShiftPressed
        disable={isMobile ? 'true' : undefined}
        style={props.style}
      >
        <Link
          as={disableLink ? undefined : NextLink}
          style={props.style}
          href={disableLink ? undefined : '/item/' + (item.slug ?? item.internal_id)}
          _hover={{ textDecoration: 'none' }}
          // pointerEvents={disableLink ? 'none' : 'initial'}
        >
          <Box
            w={{ base: 100, md: small ? 100 : 150 }}
            py={{ base: 2, md: small ? 2 : 4 }}
            px={1}
            bg="gray.700"
            bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${color[0]},${color[1]}, ${color[2]},.45) 35%)`}
            h="100%"
            borderRadius="md"
            display="flex"
            flexFlow="column"
            justifyContent="center"
            alignItems="center"
            boxShadow={selected ? 'outline' : 'lg'}
            textAlign="center"
            cursor="pointer"
            textDecoration="none"
            gap={2}
          >
            <Image
              src={`/api/cache/items/${item.image_id}.gif`}
              width={80}
              height={80}
              unoptimized
              alt={item.name}
              title={item.description}
            />
            <Text fontSize={{ base: 'xs', md: small ? 'xs' : 'sm' }}>{item.name}</Text>

            {item.price.value && item.price.inflated && (
              <Tooltip label="Inflation!" aria-label="Inflation Tooltip" placement="top">
                <Badge colorScheme="red" whiteSpace="pre-wrap">
                  <Icon as={AiFillWarning} verticalAlign="middle" /> {intl.format(item.price.value)}{' '}
                  NP
                </Badge>
              </Tooltip>
            )}

            {item.price.value && !item.price.inflated && (
              <Badge whiteSpace="pre-wrap">{intl.format(item.price.value)} NP</Badge>
            )}

            {item.type === 'pb' && <Badge colorScheme="yellow">PB</Badge>}

            {item.isNC &&
              !capValue &&
              (!item.owls ||
                (isNaN(Number(item.owls.value.split('-')[0])) && !item.owls.buyable)) && (
                <Badge colorScheme="purple">NC</Badge>
              )}

            {item.isNC &&
              item.owls &&
              !capValue &&
              !item.owls.buyable &&
              !isNaN(Number(item.owls.value.split('-')[0])) && (
                <Badge colorScheme="purple" whiteSpace="pre-wrap">
                  {item.owls.value} Owls
                </Badge>
              )}

            {item.isNC && item.owls && !capValue && item.owls.buyable && (
              <Badge colorScheme="purple">NC - Buyable</Badge>
            )}

            {item.isNC && Number(capValue) > 0 && (
              <Tooltip
                label="User Asking Price in GBCs - Not Official"
                aria-label="Not Official NC Price Tooltip"
                placement="top"
              >
                <Badge colorScheme="purple">
                  <Icon as={AiFillInfoCircle} verticalAlign="middle" /> NC - {capValue} CAPS
                </Badge>
              </Tooltip>
            )}

            {odds && (
              <Badge
                colorScheme={isLE ? 'green' : 'white'}
                whiteSpace="pre-wrap"
                textAlign={'center'}
              >
                {isLE ? 'LE' : ''} {odds.toFixed(2)}%
              </Badge>
            )}

            {(quantity ?? 0) > 1 && (
              <Text fontSize={'xs'} fontWeight="bold">
                {quantity}x
              </Text>
            )}

            {['faerieFest', 'item_id', 'rarity'].includes(sortType ?? '') && (
              <Text fontSize={'xs'} fontWeight="bold">
                {sortType === 'rarity' && item.rarity && `r${item.rarity}`}
                {sortType === 'item_id' && item.item_id && `#${item.item_id}`}
                {sortType === 'faerieFest' &&
                  !!rarityToCCPoints(item) &&
                  `${rarityToCCPoints(item)} point${rarityToCCPoints(item) > 1 ? 's' : ''}`}
              </Text>
            )}
          </Box>
        </Link>
      </CtxTrigger>
    </>
  );
};

const ItemCard = React.memo(ItemCardBase);

export default ItemCard;
