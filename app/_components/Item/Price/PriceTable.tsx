import { Box, Flex, Table, Text, Badge } from '@chakra-ui/react';
import Color from 'color';
import { FaCaretDown, FaCaretUp } from 'react-icons/fa';
import { LuMinus } from 'react-icons/lu';
import type { getFormatter } from 'next-intl/server';
import { Link as I18nLink } from '@i18n/navigation';
import Markdown from '@components/Utils/Markdown';
import { PriceTableEditButton } from '@app/_components/Item/Price/ItemPriceCard';
import {
  buildPriceTableData,
  getNextPrice,
  getPercentChange,
  type PriceOrMarker,
} from '@app/_components/Item/Price/itemPriceUtils';
import type { PriceData, PriceMarker } from '@types';

export type PriceTableTranslate = (key: string) => string;

export type PriceTableFormat = Awaited<ReturnType<typeof getFormatter>>;

type PriceTableViewProps = {
  data: PriceData[];
  markers?: PriceMarker[];
  /** Precomputed rows; when omitted, builds sync (e.g. client previews). */
  sortedData?: PriceOrMarker[];
  isAdmin?: boolean;
  /** Item accent color used for price-row borders and context link tint. */
  itemColor: string;
  t: PriceTableTranslate;
  format: PriceTableFormat;
  minH?: Record<string, number | string> | number | string;
  maxH?: Record<string, number | string> | number | string;
};

function PriceTableRow({
  price,
  sortedData,
  index,
  isAdmin,
  itemColor,
  linkColor,
  t,
  format,
}: {
  price: PriceOrMarker;
  sortedData: PriceOrMarker[];
  index: number;
  isAdmin?: boolean;
  itemColor: string;
  linkColor: string;
  t: PriceTableTranslate;
  format: PriceTableFormat;
}) {
  const bgColor = index % 2 === 0 ? 'blackAlpha.400' : 'transparent';
  const nextPrice = getNextPrice(sortedData, index);

  if (price.marker) {
    return (
      <Table.Row h={42} bg={bgColor} borderLeft={`3px solid ${price.color}85`}>
        <Table.Cell colSpan={isAdmin ? 4 : 3} border={0}>
          <Flex
            flexFlow="column"
            alignItems="center"
            gap={2}
            css={{ '& a, & strong, & b': { color: price.color } }}
          >
            {!!price.badgeText && <Badge>{price.badgeText}</Badge>}
            {!!price.title && (
              <Text as="span">
                {price.slug ? (
                  <I18nLink href={`/lists/official/${price.slug}`}>{price.title}</I18nLink>
                ) : (
                  <Markdown skipParagraph>{price.title}</Markdown>
                )}
              </Text>
            )}
            {!!price.description && (
              <Box whiteSpace="normal" fontSize="0.8rem" textAlign="center" color="whiteAlpha.700">
                <Markdown>{price.description}</Markdown>
              </Box>
            )}
            <Text fontSize="xs" color="whiteAlpha.600">
              {format.dateTime(new Date(price.addedAt!), {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </Flex>
        </Table.Cell>
      </Table.Row>
    );
  }

  if (price.value === 0) {
    return (
      <Table.Row h={50} bg={bgColor} border={0} borderLeft={`3px solid ${itemColor}`}>
        <Table.Cell colSpan={isAdmin ? 3 : 4}>
          <Flex flexFlow="column" alignItems="center" gap={2}>
            {format.dateTime(new Date(price.addedAt!), {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
            <Text textAlign="center" color="whiteAlpha.700">
              {t('ItemPage.unknown-price-msg')}
            </Text>
          </Flex>
        </Table.Cell>
        {isAdmin && (
          <Table.Cell px={1}>
            <PriceTableEditButton price={price as PriceData} />
          </Table.Cell>
        )}
      </Table.Row>
    );
  }

  if (price.isUnconfirmed) {
    return (
      <Table.Row h={50} bg={bgColor} border={0} borderLeft={`3px solid ${itemColor}`}>
        <Table.Cell colSpan={4}>
          <Flex flexFlow="column" alignItems="center" gap={2}>
            <Text textAlign="center">{t('ItemPage.unconfirmed-price')}</Text>
            <Text
              textAlign="center"
              color="whiteAlpha.700"
              maxW="90%"
              fontSize="sm"
              whiteSpace="normal"
            >
              {t('ItemPage.unconfirmed-price-text')}
            </Text>
          </Flex>
        </Table.Cell>
      </Table.Row>
    );
  }

  return (
    <>
      <Table.Row
        bg={bgColor}
        border={0}
        borderLeft={price.color ? `3px solid ${price.color}85` : undefined}
      >
        <Table.Cell>
          <Flex alignItems="center">
            <Flex flexFlow="column">
              {price.inflated && (
                <Text fontWeight="bold" color="red.400">
                  {t('General.inflation')}!
                </Text>
              )}
              {format.number(price.value!)} NP
            </Flex>
          </Flex>
        </Table.Cell>
        <Table.Cell px={1}>
          {!!nextPrice?.value && (
            <Flex alignItems="center">
              {!!(price.value! - nextPrice.value) && (
                <Flex
                  display="inline-flex"
                  flexFlow="column"
                  justifyContent="center"
                  alignItems="center"
                >
                  {price.value! - nextPrice.value > 0 && <FaCaretUp color="#68D391" size={22} />}
                  {price.value! - nextPrice.value < 0 && <FaCaretDown color="#FC8181" size={22} />}
                </Flex>
              )}
              {!(price.value! - nextPrice.value) && (
                <LuMinus size={16} style={{ marginRight: 4, display: 'inline-block' }} />
              )}
              <Text>{format.number(price.value! - nextPrice.value)} NP</Text>
              <Text
                ml={1}
                fontSize="0.55rem"
                color={price.value! > nextPrice.value ? 'green.100' : 'red.200'}
                opacity={0.8}
              >
                {getPercentChange(price.value!, nextPrice.value!)}%
              </Text>
            </Flex>
          )}
        </Table.Cell>
        <Table.Cell px={1}>
          {format.dateTime(new Date(price.addedAt!), {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Table.Cell>
        {isAdmin && (
          <Table.Cell px={1}>
            <PriceTableEditButton price={price as PriceData} />
          </Table.Cell>
        )}
      </Table.Row>
      {!!price.context && (
        <Table.Row bg={bgColor} border={0}>
          <Table.Cell colSpan={4}>
            <Box
              whiteSpace="normal"
              fontSize="0.8rem"
              color="whiteAlpha.700"
              textAlign="center"
              bg="blackAlpha.300"
              p={1}
              borderRadius="md"
              css={{ '& a': { color: linkColor } }}
            >
              <Text fontWeight="bold" mb={2}>
                {t('ItemPage.price-context')}
              </Text>
              <Markdown>{price.context}</Markdown>
            </Box>
          </Table.Cell>
        </Table.Row>
      )}
    </>
  );
}

export function PriceTableView({
  data,
  markers = [],
  sortedData: sortedDataProp,
  isAdmin,
  itemColor,
  t,
  format,
  minH = { base: 100 },
  maxH = { base: 200, md: 300 },
}: PriceTableViewProps) {
  const sortedData = sortedDataProp ?? buildPriceTableData(data, markers, t);
  const linkColor = Color(itemColor).alpha(0.8).lightness(70).hexa();

  return (
    <Table.ScrollArea minH={minH} maxH={maxH} w="100%" borderRadius="sm">
      <Table.Root h="100%" size="sm" css={{ '& td': { border: 0 } }}>
        <Table.Body>
          {sortedData.map((price, index) => (
            <PriceTableRow
              key={
                price.marker
                  ? `${price.markerId}-${price.markerEdge}`
                  : `price-${price.price_id ?? price.addedAt}`
              }
              price={price}
              sortedData={sortedData}
              index={index}
              isAdmin={isAdmin}
              itemColor={itemColor}
              linkColor={linkColor}
              t={t}
              format={format}
            />
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}
