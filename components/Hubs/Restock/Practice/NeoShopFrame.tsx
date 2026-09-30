import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';
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
  // Rendered in place of the grid while there is no restock on screen (idle state)
  placeholder?: ReactNode;
};

export function NeoShopFrame({
  shop,
  items,
  onItemClick,
  onRefresh,
  placeholder,
}: NeoShopFrameProps) {
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
          fontFamily='"Cafeteria", "Arial Bold", sans-serif'
          fontSize="2em"
          fontWeight="bold"
          lineHeight="normal"
          color="#000"
        >
          {shop.name}
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

      {/* .shop-info */}
      <Text
        w="90%"
        m="auto auto 10px"
        textAlign="center"
        fontSize="11pt"
        css={{ [smallText]: { display: 'none' } }}
      >
        <b>{shop.name}</b>
      </Text>

      {/* .container h2 */}
      <Heading
        as="div"
        w="100%"
        m="auto"
        p="10px"
        bg="#000"
        color="#fff"
        textAlign="center"
        fontFamily={MUSEO_700}
        fontSize="13pt"
        fontWeight="bold"
        lineHeight="normal"
      >
        Shop Inventory
      </Heading>

      {items === null && placeholder}

      {items && items.length === 0 && (
        <Text m="20px auto" w="90%" textAlign="center" fontSize="11pt">
          Sorry, we are sold out of everything!
        </Text>
      )}

      {items && items.length > 0 && (
        <Box
          w="90%"
          m="20px auto"
          display="grid"
          gridTemplateRows="auto"
          gap="10px"
          css={gridColumns}
        >
          {items.map((item) => (
            <NeoShopItem key={item.id} item={item} onClick={onItemClick} />
          ))}
        </Box>
      )}
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
