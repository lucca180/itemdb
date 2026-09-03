import type { ReactNode } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import ItemCardV2 from '@components/Items/v2/ItemCardV2';
import type { ItemV2For } from '@types';

type MallItemStripProps = {
  items: ItemV2For<'card'>[];
  uniqueID: string;
  captionFor?: (item: ItemV2For<'card'>) => ReactNode;
  small?: boolean;
  wrap?: boolean;
};

export function MallItemStrip({
  items,
  uniqueID,
  captionFor,
  small = true,
  wrap = false,
}: MallItemStripProps) {
  const columnSize = small ? '100px' : '150px';

  return (
    <Box
      w="100%"
      minW={0}
      overflowX={wrap ? undefined : 'auto'}
      pb={wrap ? undefined : 2}
      css={
        wrap
          ? {
              display: 'grid',
              gridTemplateColumns: `repeat(auto-fill, ${columnSize})`,
              justifyContent: 'center',
              alignItems: 'stretch',
              gap: 'var(--chakra-spacing-3)',
              '& > *': { minWidth: 0 },
            }
          : {
              display: 'grid',
              gridAutoFlow: 'column',
              gridAutoColumns: columnSize,
              justifyContent: 'start',
              alignItems: 'stretch',
              gap: 'var(--chakra-spacing-3)',
              scrollSnapType: 'x proximity',
              scrollbarWidth: 'thin',
              '& > *': { scrollSnapAlign: 'start', minWidth: 0, height: '100%' },
              '&::-webkit-scrollbar': { height: '6px' },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(255,255,255,0.18)',
                borderRadius: '999px',
              },
            }
      }
    >
      {items.map((item) => {
        const caption = captionFor?.(item);
        return (
          <Flex key={item.internal_id} direction="column" gap={2} minW={0} h="100%">
            <Box
              flex="1"
              display="flex"
              minH={0}
              w="100%"
              css={{
                '& > *': {
                  display: 'flex',
                  flex: 1,
                  width: '100%',
                  height: '100%',
                  alignSelf: 'stretch',
                },
              }}
            >
              <ItemCardV2
                item={item}
                uniqueID={uniqueID}
                utm_content={uniqueID}
                small={small}
                style={small ? undefined : { width: 150 }}
              />
            </Box>
            {caption ? (
              <Text
                fontSize="2xs"
                color="whiteAlpha.600"
                lineHeight="1.4"
                lineClamp={2}
                minH="2.8em"
                flexShrink={0}
              >
                {caption}
              </Text>
            ) : null}
          </Flex>
        );
      })}
    </Box>
  );
}
