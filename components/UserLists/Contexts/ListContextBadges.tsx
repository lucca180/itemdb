'use client';

import { Box, Flex, Text, type BoxProps, type FlexProps } from '@chakra-ui/react';
import { LuInfo } from 'react-icons/lu';
import type { ListContext } from '@types';
import {
  ListContextPopover,
  contextTextColor,
} from '@components/UserLists/Contexts/ListContextPopover';

const TRIANGLE = { clipPath: 'polygon(0 0, 100% 0, 100% 100%)' };

/**
 * Folded corner for the top-right of an item card, in the first context's color. One context
 * shows ⓘ; more than one shows a dot per context (up to 3). Absolutely positioned: the card
 * wrapper must be `position: relative` (`ItemCardV2`'s `corner` slot is).
 */
function FoldCorner({ contexts, ...rest }: { contexts: ListContext[] } & Omit<BoxProps, 'style'>) {
  const first = contexts[0];
  const count = contexts.length;

  return (
    <Box
      as="button"
      aria-label={contexts.map((context) => context.badgeText).join(', ')}
      {...rest}
      position="absolute"
      top={0}
      right={0}
      zIndex={1}
      w="30px"
      h="30px"
      cursor="help"
    >
      <Box
        position="absolute"
        inset={0}
        borderTopRightRadius="md"
        css={TRIANGLE}
        style={{ background: first.color }}
      />
      <Flex position="absolute" top="3px" right="3px" color={contextTextColor(first.color)}>
        {count > 1 ? (
          <Flex gap="2px" mt="1px">
            {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
              <Box key={i} w="4px" h="4px" borderRadius="full" bg="currentColor" />
            ))}
          </Flex>
        ) : (
          <LuInfo size={11} strokeWidth={3} />
        )}
      </Flex>
    </Box>
  );
}

export function ListContextCorner({
  contexts,
  onSeeAll,
}: {
  contexts: ListContext[];
  onSeeAll?: (contextId: number) => void;
}) {
  if (!contexts.length) return null;

  return (
    <ListContextPopover contexts={contexts} onSeeAll={onSeeAll}>
      <FoldCorner contexts={contexts} />
    </ListContextPopover>
  );
}

function FooterButton({
  contexts,
  listColor,
  ...rest
}: { contexts: ListContext[]; listColor: string | null } & Omit<FlexProps, 'style'>) {
  const extra = contexts.length - 1;

  return (
    <Flex
      as="button"
      mt={1}
      mx={-3}
      mb={-2}
      px={3}
      py={1}
      gap={1}
      alignItems="center"
      justifyContent="center"
      alignSelf="stretch"
      borderBottomRadius="md"
      fontSize="xs"
      fontWeight="bold"
      color="white"
      cursor="help"
      _hover={{ filter: 'brightness(1.15)' }}
      style={{ background: `color-mix(in srgb, ${listColor || '#4A5568'} 60%, black)` }}
      {...rest}
    >
      <Text as="span" truncate>
        {contexts[0].badgeText}
      </Text>
      {extra > 0 && (
        <Text as="span" flex="0 0 auto" opacity={0.75}>
          +{extra}
        </Text>
      )}
      <Box flex="0 0 auto" display="flex">
        <LuInfo size={12} strokeWidth={2.75} />
      </Box>
    </Flex>
  );
}

/** Footer of the official list card on the item page, in the list's own color. */
export function ListContextFooter({
  contexts,
  listColor,
}: {
  contexts: ListContext[];
  listColor: string | null;
}) {
  if (!contexts.length) return null;

  return (
    <ListContextPopover contexts={contexts}>
      <FooterButton contexts={contexts} listColor={listColor} />
    </ListContextPopover>
  );
}
