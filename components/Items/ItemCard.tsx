import { Badge, Box, Icon, Skeleton, Text, Link, Tooltip, useMediaQuery } from '@chakra-ui/react';
import React, { useState } from 'react';
import Image from 'next/image';
import { ItemData } from '../../types';
import { AiFillInfoCircle, AiFillWarning } from 'react-icons/ai';
import ItemCtxMenu, { CtxTrigger } from '../Menus/ItemCtxMenu';
import { getRestockProfit, rarityToCCPoints } from '../../utils/utils';
import { useFormatter, useTranslations } from 'next-intl';
import MainLink from '../Utils/MainLink';
import { MdHelp } from 'react-icons/md';
import { isMallDiscounted } from './NCMallCard';

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
  disablePrefetch?: boolean;
  highlight?: boolean;
  utm_content?: string;
  uniqueID?: string;
};

const ItemCardBase = (props: ItemProps) => {
  const {
    item,
    isLoading,
    selected,
    disableLink,
    quantity,
    small,
    onListAction,
    sortType,
    disablePrefetch,
    highlight,
    utm_content,
    uniqueID,
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

  const profit = getRestockProfit(item);

  return (
    <>
      <ItemCtxMenu
        menuId={item.internal_id.toString() + uniqueID}
        item={item}
        onSelect={props.onSelect}
        onListAction={onListAction}
      />
      <CtxTrigger
        id={item.internal_id.toString() + uniqueID}
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        disableWhileShiftPressed
        disable={isMobile ? true : undefined}
        style={props.style}
      >
        <Link
          as={disableLink ? undefined : MainLink}
          style={props.style}
          prefetch={disableLink || disablePrefetch !== false ? false : undefined}
          href={
            disableLink
              ? undefined
              : '/item/' +
                (item.slug ?? item.internal_id) +
                (utm_content ? `?utm_content=${utm_content}` : '')
          }
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
            filter={highlight ? 'drop-shadow(0px 0px 5px #f0f03d)' : undefined}
            textAlign="center"
            cursor="pointer"
            textDecoration="none"
            gap={2}
          >
            <ItemImage item={item} />
            <Text fontSize={{ base: 'xs', md: small ? 'xs' : 'sm' }}>{item.name}</Text>

            <ItemCardBadge {...props} profit={profit} />

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

type ItemCardBadgeProps = Pick<ItemProps, 'item' | 'capValue' | 'odds' | 'sortType' | 'isLE'> & {
  profit?: number | null;
};

export const ItemCardBadge = (props: ItemCardBadgeProps) => {
  const t = useTranslations();
  const format = useFormatter();
  const { item, capValue, odds, profit, isLE, sortType } = props;

  if (!item) return null;
  const isDiscounted = isMallDiscounted(item.mallData);

  return (
    <>
      {item.price.value && item.price.inflated && (
        <Tooltip label={t('General.inflation')} aria-label="Inflation Tooltip" placement="top">
          <Badge colorScheme="red" whiteSpace="normal">
            <Icon as={AiFillWarning} verticalAlign="middle" /> {format.number(item.price.value)} NP
          </Badge>
        </Tooltip>
      )}

      {item.price.value && !item.price.inflated && (
        <Badge whiteSpace="normal">{format.number(item.price.value)} NP</Badge>
      )}

      {item.type === 'np' && item.status === 'no trade' && <Badge>No Trade</Badge>}

      {item.type === 'pb' && <Badge colorScheme="yellow">PB</Badge>}

      {item.isNC && !capValue && !item.mallData && !item.ncValue && (
        <Badge colorScheme="purple">NC</Badge>
      )}

      {item.isNC && item.ncValue && !capValue && !item.mallData && (
        <Badge
          colorScheme={item.ncValue.source === 'lebron' ? 'yellow' : 'purple'}
          whiteSpace="normal"
        >
          {item.ncValue.range} Caps
        </Badge>
      )}

      {item.isNC && item.mallData && (
        <Badge colorScheme={isDiscounted ? 'orange' : 'purple'} whiteSpace="normal">
          {item.mallData.price > 0 &&
            `${format.number(
              isDiscounted ? (item.mallData.discountPrice ?? -1) : item.mallData.price
            )} NC`}
          {item.mallData.price === 0 && t('ItemPage.free')}
        </Badge>
      )}

      {item.isNC && Number(capValue) > 0 && (
        <Tooltip
          label="User Asking Price in GBCs - Not Official"
          aria-label="Not Official NC Price Tooltip"
          placement="top"
        >
          <Badge colorScheme="purple" whiteSpace="normal">
            <Icon as={AiFillInfoCircle} verticalAlign="middle" /> NC - {capValue} CAPS
          </Badge>
        </Tooltip>
      )}

      {!!odds && (
        <Badge colorScheme={isLE ? 'green' : 'white'} whiteSpace="pre-wrap" textAlign={'center'}>
          {isLE ? 'LE' : ''} {odds.toFixed(2)}%
        </Badge>
      )}

      {sortType === 'profit' && !!profit && (
        <>
          {profit <= 1000 && (
            <>
              <Tooltip
                hasArrow
                label={
                  profit > 0
                    ? t('Restock.estimated-profit-is-less-than')
                    : t('Restock.estimated-loss')
                }
                placement="top"
              >
                <Badge colorScheme="red" display="flex" alignItems={'center'} gap={1}>
                  {format.number(profit)} NP <MdHelp size={'0.7rem'} />
                </Badge>
              </Tooltip>
            </>
          )}
          {profit > 1000 && (
            <>
              <Tooltip hasArrow label={t('Restock.estimated-profit')} placement="top">
                <Badge colorScheme="green" display="flex" alignItems={'center'} gap={1}>
                  {format.number(profit)} NP <MdHelp size={'0.7rem'} />
                </Badge>
              </Tooltip>
            </>
          )}
        </>
      )}
    </>
  );
};

type ImageProps = React.ComponentProps<typeof Image>;

export const ItemImage = (props: { item: ItemData } & Partial<ImageProps>) => {
  const { item } = props;
  const [error, setError] = useState(false);

  const src = error
    ? `/api/cache/items/${item.image_id}.gif`
    : `https://cdn.itemdb.com.br/items/${item.image_id}.gif`;

  return (
    <Image
      src={src}
      width={80}
      height={80}
      unoptimized
      alt={item.name}
      title={item.description}
      onError={() => setError(true)}
      {...props}
    />
  );
};
