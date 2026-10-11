import { Box, Flex, Table, Text, Badge } from '@chakra-ui/react';
import type { CSSProperties, ReactNode } from 'react';
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
  /** True when `data` is a partial slice (e.g. summary) of the full price history. */
  truncated?: boolean;
  isAdmin?: boolean;
  /** Item accent color used for price-row borders and context link tint. */
  itemColor: string;
  t: PriceTableTranslate;
  format: PriceTableFormat;
  minH?: Record<string, number | string> | number | string;
  maxH?: Record<string, number | string> | number | string;
  footer?: ReactNode;
};

const MARKER_DATE_FORMAT = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
} as const;

const DEFAULT_MIN_H = { base: 100 };
const DEFAULT_MAX_H = { base: 200, md: 300 };

/**
 * Row styling lives in static selectors (striping, colored left border, change colors) and
 * per-row values go through CSS variables, so rows don't generate per-row Emotion classes.
 */
const TABLE_CSS = {
  '& td': { border: 0 },
  '& tr[data-row] td:not(:first-of-type)': { px: 1 },
  '& tr[data-row]': { bg: 'transparent' },
  '& tr[data-row][data-odd]': { bg: 'blackAlpha.400' },
  '& tr[data-row][data-colored]': { borderLeft: '3px solid var(--price-row-border)' },
  '& [data-marker-body] :is(a, strong, b)': { color: 'var(--price-marker-color)' },
  '& [data-price-context] a': { color: 'var(--price-link-color)' },
  '& [data-pct]': { ml: 1, fontSize: '0.55rem', opacity: 0.8, color: 'red.200' },
  '& [data-pct][data-up]': { color: 'green.100' },
};

/** Data attributes (+ CSS variables when colored) matched by {@link TABLE_CSS}. */
function rowProps(odd: boolean | undefined, border?: string, markerColor?: string) {
  if (!border) return { 'data-row': true, 'data-odd': odd };
  return {
    'data-row': true,
    'data-odd': odd,
    'data-colored': true,
    style: {
      '--price-row-border': border,
      ...(markerColor ? { '--price-marker-color': markerColor } : {}),
    } as CSSProperties,
  };
}

function formatMarkerDate(price: PriceOrMarker, format: PriceTableFormat) {
  const start = format.dateTime(new Date(price.addedAt!), MARKER_DATE_FORMAT);
  if (!price.rangeEndAt) return start;

  const end = format.dateTime(new Date(price.rangeEndAt), MARKER_DATE_FORMAT);
  if (start === end) return start;
  return `${start} - ${end}`;
}

function PriceTableRow({
  price,
  sortedData,
  index,
  isAdmin,
  itemColor,
  t,
  format,
}: {
  price: PriceOrMarker;
  sortedData: PriceOrMarker[];
  index: number;
  isAdmin?: boolean;
  itemColor: string;
  t: PriceTableTranslate;
  format: PriceTableFormat;
}) {
  const odd = index % 2 === 0 || undefined;
  const nextPrice = getNextPrice(sortedData, index);

  if (price.marker) {
    return (
      <Table.Row h={42} {...rowProps(odd, `${price.color}85`, price.color)}>
        <Table.Cell colSpan={isAdmin ? 4 : 3}>
          <Flex flexFlow="column" alignItems="center" gap={2} data-marker-body>
            {!!price.badgeText && <Badge>{price.badgeText}</Badge>}
            {!!price.title && (
              <span>
                {price.slug ? (
                  <I18nLink href={`/lists/official/${price.slug}`}>{price.title}</I18nLink>
                ) : (
                  <Markdown skipParagraph>{price.title}</Markdown>
                )}
              </span>
            )}
            {!!price.description && (
              <Box whiteSpace="normal" fontSize="0.8rem" textAlign="center" color="whiteAlpha.700">
                <Markdown>{price.description}</Markdown>
              </Box>
            )}
            <Text fontSize="xs" color="whiteAlpha.600">
              {formatMarkerDate(price, format)}
            </Text>
          </Flex>
        </Table.Cell>
      </Table.Row>
    );
  }

  if (price.value === 0) {
    return (
      <Table.Row h={50} {...rowProps(odd, itemColor)}>
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
          <Table.Cell>
            <PriceTableEditButton price={price as PriceData} />
          </Table.Cell>
        )}
      </Table.Row>
    );
  }

  if (price.isUnconfirmed) {
    return (
      <Table.Row h={50} {...rowProps(odd, itemColor)}>
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

  const diff = nextPrice?.value ? price.value! - nextPrice.value : 0;

  return (
    <>
      <Table.Row {...rowProps(odd, price.color ? `${price.color}85` : undefined)}>
        <Table.Cell>
          {price.inflated && (
            <Text fontWeight="bold" color="red.400">
              {t('General.inflation')}!
            </Text>
          )}
          {format.number(price.value!)} NP
        </Table.Cell>
        <Table.Cell>
          {!!nextPrice?.value && (
            <Flex alignItems="center">
              {diff > 0 && <FaCaretUp color="#68D391" size={22} />}
              {diff < 0 && <FaCaretDown color="#FC8181" size={22} />}
              {!diff && <LuMinus size={16} style={{ marginRight: 4, display: 'inline-block' }} />}
              <span>{format.number(diff)} NP</span>
              <span data-pct data-up={price.value! > nextPrice.value || undefined}>
                {getPercentChange(price.value!, nextPrice.value!)}%
              </span>
            </Flex>
          )}
        </Table.Cell>
        <Table.Cell>
          {format.dateTime(new Date(price.addedAt!), {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Table.Cell>
        {isAdmin && (
          <Table.Cell>
            <PriceTableEditButton price={price as PriceData} />
          </Table.Cell>
        )}
      </Table.Row>
      {!!price.context && (
        <Table.Row {...rowProps(odd)}>
          <Table.Cell colSpan={4}>
            <Box
              whiteSpace="normal"
              fontSize="0.8rem"
              color="whiteAlpha.700"
              textAlign="center"
              bg="blackAlpha.300"
              p={1}
              borderRadius="md"
              data-price-context
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
  truncated = false,
  isAdmin,
  itemColor,
  t,
  format,
  minH = DEFAULT_MIN_H,
  maxH = DEFAULT_MAX_H,
  footer,
}: PriceTableViewProps) {
  const sortedData = sortedDataProp ?? buildPriceTableData(data, markers, t, truncated);
  const linkColor = Color(itemColor).alpha(0.8).lightness(70).hexa();

  return (
    <Table.ScrollArea minH={minH} maxH={maxH} w="100%" borderRadius="sm">
      <Table.Root
        h="100%"
        size="sm"
        css={TABLE_CSS}
        style={{ '--price-link-color': linkColor } as CSSProperties}
      >
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
              t={t}
              format={format}
            />
          ))}
          {footer}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}
