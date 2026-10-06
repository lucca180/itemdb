'use client';

import type { ReactNode } from 'react';
import { Badge, HStack, Text } from '@chakra-ui/react';
import { resolveImportAmount, type ImportQuantityMode } from '@utils/list/importQuantityMode';

export type ImportQuantityMathProps = {
  mode: ImportQuantityMode;
  /** Amount already in the list; `null` for new items. */
  listAmount: number | null;
  imported: number;
};

/** Gray = list amount, teal = imported amount, struck = discarded value, badge = result. */
export const LIST_AMOUNT_COLOR = 'gray.300';
export const IMPORTED_AMOUNT_COLOR = 'teal.300';

export function ImportQuantityBadge({ value }: { value: number }) {
  return (
    <Badge
      size="sm"
      colorPalette={value > 1 ? 'teal' : 'gray'}
      variant={value > 1 ? 'solid' : 'subtle'}
      textTransform="none"
    >
      {value}x
    </Badge>
  );
}

function Amount({ value, color, struck }: { value: number; color: string; struck?: boolean }) {
  return (
    <Text
      as="span"
      fontSize="xs"
      fontWeight="semibold"
      color={color}
      textDecoration={struck ? 'line-through' : undefined}
      opacity={struck ? 0.6 : 1}
    >
      {value}
    </Text>
  );
}

function Op({ children }: { children: ReactNode }) {
  return (
    <Text as="span" fontSize="xs" color="whiteAlpha.500">
      {children}
    </Text>
  );
}

/** Shows how an imported quantity combines with the list amount, e.g. `2 + 3 → 5x`. */
export function ImportQuantityMath({ mode, listAmount, imported }: ImportQuantityMathProps) {
  const result = resolveImportAmount(mode, listAmount, imported);
  const parts: ReactNode[] = [];

  if (mode === 'sum' && listAmount !== null) {
    parts.push(
      <Amount key="list" value={listAmount} color={LIST_AMOUNT_COLOR} />,
      <Op key="plus">+</Op>,
      <Amount key="imported" value={imported} color={IMPORTED_AMOUNT_COLOR} />
    );
  } else if (mode === 'replace' && listAmount !== null) {
    parts.push(<Amount key="list" value={listAmount} color={LIST_AMOUNT_COLOR} struck />);
  } else if (mode === 'keep' && imported !== result) {
    parts.push(<Amount key="imported" value={imported} color={IMPORTED_AMOUNT_COLOR} struck />);
  }

  return (
    <HStack gap={1} justify="center" flexWrap="nowrap" whiteSpace="nowrap">
      {parts}
      {parts.length > 0 && <Op>→</Op>}
      <ImportQuantityBadge value={result} />
    </HStack>
  );
}
