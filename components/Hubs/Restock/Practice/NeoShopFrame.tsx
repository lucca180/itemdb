import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';
import type { ShopInfo } from '@types';
import type { PracticeStockedItem } from '@utils/restockPractice';

// Replica of the Neopets shop page. Spacing, grid breakpoints and sizes mirror
// images.neopets.com/themes/h5/common/{template,shoptemplate,shoppage}.css — keep them in sync.

const MUSEO_500 = '"MuseoSansRounded500", Arial, sans-serif';
const MUSEO_700 = '"MuseoSansRounded700", Arial, sans-serif';

// Neopets uses viewport breakpoints (not Chakra's) to pick the column count.
const gridColumns = {
  '@media screen and (max-width: 189px)': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
  '@media screen and (min-width: 190px) and (max-width: 289px)': {
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  },
  '@media screen and (min-width: 290px) and (max-width: 389px)': {
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  },
  '@media screen and (min-width: 390px) and (max-width: 489px)': {
    gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
  },
  '@media screen and (min-width: 490px) and (max-width: 589px)': {
    gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
  },
  '@media screen and (min-width: 590px) and (max-width: 689px)': {
    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
  },
  '@media screen and (min-width: 690px)': { gridTemplateColumns: 'repeat(8, minmax(0, 1fr))' },
};

const itemImgSize = {
  '@media screen and (max-width: 849px)': { height: 0, width: '90%', paddingBottom: '90%' },
  '@media screen and (min-width: 850px)': { width: '80px', height: '80px', paddingBottom: 0 },
};

const smallText = '@media screen and (max-width: 481px)';
const largeText = '@media screen and (min-width: 482px)';

type NeoShopFrameProps = {
  shop: ShopInfo;
  items: PracticeStockedItem[] | null;
  onItemClick: (item: PracticeStockedItem, timeStamp: number) => void;
  // Clicking the shopkeeper reloads the shop on Neopets
  onRefresh: () => void;
  // Shown on top of the (empty) inventory while there is no restock on screen
  placeholder?: ReactNode;
  // Practice controls (stats, timer) shown under the shopkeeper — not part of the Neopets page
  toolbar?: ReactNode;
  // Shown inline after the shop name in the title (e.g. a "beta" badge)
  titleBadge?: ReactNode;
};

const INVENTORY_MIN_HEIGHT = 200;
// .shop-grid vertical margins (20px auto)
const GRID_MARGIN_Y = 40;

/**
 * Tallest height the grid reached at the current width: the inventory never shrinks between
 * refreshes (no layout shift), and starts over when the width changes (new column count).
 */
function useLargestHeight(ref: React.RefObject<HTMLDivElement | null>) {
  const [largest, setLargest] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let width = -1;
    const observer = new ResizeObserver(([entry]) => {
      const { width: newWidth, height } = entry.contentRect;
      const widthChanged = newWidth !== width;
      width = newWidth;
      setLargest((prev) => (widthChanged ? height : Math.max(prev, height)));
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return largest;
}

export function NeoShopFrame({
  shop,
  items,
  onItemClick,
  onRefresh,
  placeholder,
  toolbar,
  titleBadge,
}: NeoShopFrameProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const inventoryMinHeight = useLargestHeight(gridRef);
  return (
    <Box
      position="relative"
      w="100%"
      maxW="1080px"
      mx="auto"
      pb="2em"
      bg="#fff"
      color="#000"
      overflowX="hidden"
      fontSize="11pt"
      fontFamily={MUSEO_500}
      lineHeight="normal"
      borderRadius="md"
      userSelect="none"
    >
      {/* .page-title__2020 */}
      <Box position="relative" display="flex" minH="39px" mt="10px" mb="5px">
        <Heading
          as="div"
          w="calc(100% - 100px)"
          m="auto"
          textAlign="center"
          // Neopets uses Cafeteria (licensed, not loaded here): use the site's heading font instead
          fontFamily="heading"
          fontSize="2em"
          fontWeight="bold"
          lineHeight="normal"
          color="#000"
        >
          {shop.name}
          {titleBadge && (
            <Box as="span" display="inline-flex" verticalAlign="middle" ml={2} fontFamily="body">
              {titleBadge}
            </Box>
          )}
        </Heading>
      </Box>

      {/* .shop-bg */}
      <Box
        mx="auto"
        my="20px"
        w="90%"
        h={0}
        pb="30%"
        bgImage={`url(https://images.neopets.com/shopkeepers/w${shop.id}.gif)`}
        bgSize="100%"
        bgRepeat="no-repeat"
        role="button"
        aria-label={shop.name}
        onClick={onRefresh}
        css={{
          '@media screen and (max-width: 481px)': { margin: '10px auto' },
          '@media screen and (min-width: 500px)': {
            width: '450px',
            height: '150px',
            paddingBottom: 0,
            cursor: 'pointer',
          },
        }}
      />

      {toolbar && (
        <Box w="90%" mx="auto" mb="10px">
          {toolbar}
        </Box>
      )}

      {/* .container h2 */}
      <Heading
        as="div"
        w="100%"
        m="auto"
        p="10px"
        bg="#000"
        color="#fff"
        textAlign="center"
        fontFamily="heading"
        fontSize="13pt"
        fontWeight="bold"
        lineHeight="normal"
      >
        Shop Inventory
      </Heading>

      <Box
        position="relative"
        minH={`${Math.max(INVENTORY_MIN_HEIGHT, inventoryMinHeight + GRID_MARGIN_Y)}px`}
      >
        {/* Always mounted (empty while loading) so its height can be tracked across refreshes */}
        <Box
          ref={gridRef}
          w="90%"
          m="20px auto"
          display="grid"
          gridTemplateRows="auto"
          gap="10px"
          css={gridColumns}
        >
          {items?.map((item) => (
            <NeoShopItem key={item.id} item={item} onClick={onItemClick} />
          ))}
        </Box>

        {(items === null || items.length === 0) && (
          <Box position="absolute" top={0} left={0} right={0}>
            {items === null ? (
              placeholder
            ) : (
              <Text m="20px auto" w="90%" textAlign="center" fontSize="11pt">
                Sorry, we are sold out of everything!
              </Text>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}

type NeoShopItemProps = {
  item: PracticeStockedItem;
  onClick: (item: PracticeStockedItem, timeStamp: number) => void;
};

function NeoShopItem({ item, onClick }: NeoShopItemProps) {
  const handleClick = (e: MouseEvent<HTMLDivElement>) => onClick(item, e.timeStamp);
  const handleKeyUp = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') onClick(item, e.timeStamp);
  };

  return (
    <Box>
      <Box
        role="button"
        tabIndex={0}
        aria-label={item.name}
        m="auto"
        cursor="pointer"
        bgImage={`url(${item.image})`}
        bgPos="center"
        bgRepeat="no-repeat"
        bgSize="100%"
        css={itemImgSize}
        onClick={handleClick}
        onKeyUp={handleKeyUp}
      />
      <Text
        w="90%"
        m="auto"
        textAlign="center"
        fontFamily={MUSEO_700}
        css={{ [smallText]: { fontSize: '8pt' }, [largeText]: { fontSize: '11pt' } }}
      >
        <b>{item.name}</b>
      </Text>
      <Text
        w="90%"
        m="auto"
        textAlign="center"
        css={{ [smallText]: { fontSize: '6pt' }, [largeText]: { fontSize: '9pt' } }}
      >
        {item.stock} in stock
      </Text>
      <Text
        w="90%"
        m="auto"
        textAlign="center"
        css={{ [smallText]: { fontSize: '6pt' }, [largeText]: { fontSize: '9pt' } }}
      >
        Cost: {item.shopPrice.toLocaleString('en-US')} NP
      </Text>
    </Box>
  );
}
