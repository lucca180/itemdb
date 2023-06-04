import { Badge, Box, Icon, Skeleton, Text, Link, Tooltip, useMediaQuery } from '@chakra-ui/react';
import React from 'react';
import Image from 'next/image';
import { ItemData } from '../../types';
import NextLink from 'next/link';
import { AiFillInfoCircle, AiFillWarning } from 'react-icons/ai';
import ItemCtxMenu, { CtxTrigger } from '../Modal/ItemCtxMenu';

export type ItemProps = {
  item?: ItemData;
  isLoading?: boolean;
  selected?: boolean;
  disableLink?: boolean;
  capValue?: number | null;
  quantity?: number;
  onSelect?: () => void;
  style?: React.CSSProperties;
};

const intl = new Intl.NumberFormat();

const ItemCardBase = (props: ItemProps) => {
  const { item, isLoading, selected, disableLink, capValue, quantity } = props;
  const [isMobile] = useMediaQuery('(hover: none)');

  const color = item?.color.rgb;

  if (!item || isLoading || !color)
    return (
      <Link as={'a'} _hover={{ textDecoration: 'none' }} pointerEvents="none" style={props.style}>
        <Box
          w={{ base: 100, md: 150 }}
          py={{ base: 2, md: 4 }}
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
      <ItemCtxMenu item={item} onSelect={props.onSelect} />
      <CtxTrigger
        id={item.internal_id.toString()}
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        disableWhileShiftPressed
        disable={isMobile}
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
            w={{ base: 100, md: 150 }}
            py={{ base: 2, md: 4 }}
            px={2}
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
            <Text fontSize={{ base: 'xs', md: 'sm' }}>{item.name}</Text>

            {item.price.value && item.price.inflated && (
              <Tooltip label="Inflated!" aria-label="Inflation Tooltip" placement="top">
                <Badge colorScheme="red">
                  <Icon as={AiFillWarning} verticalAlign="text-top" />{' '}
                  {intl.format(item.price.value)} NP
                </Badge>
              </Tooltip>
            )}

            {item.price.value && !item.price.inflated && (
              <Badge>{intl.format(item.price.value)} NP</Badge>
            )}

            {item.type === 'pb' && <Badge colorScheme="yellow">PB</Badge>}

            {item.isNC && !capValue && !item.owls && <Badge colorScheme="purple">NC</Badge>}
            {item.isNC && item.owls && !capValue && (
              <Badge colorScheme="purple">{item.owls.value} Owls</Badge>
            )}
            {item.isNC && Number(capValue) > 0 && (
              <Tooltip
                label="User Asking Price in GBCs - Not Official"
                aria-label="Inflation Tooltip"
                placement="top"
              >
                <Badge colorScheme="purple">
                  <Icon as={AiFillInfoCircle} verticalAlign="middle" /> NC - {capValue} CAPS
                </Badge>
              </Tooltip>
            )}

            {(quantity ?? 0) > 1 && (
              <Text fontSize={'xs'} fontWeight="bold">
                {quantity}x
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
