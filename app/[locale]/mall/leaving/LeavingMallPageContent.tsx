import type { ReactNode } from 'react';
import { Box, Center, Flex, Heading, HStack, Image, Separator, Text } from '@chakra-ui/react';
import ItemCard from '@components/Items/ItemCard';
import Color from 'color';
import type { LeavingMallDateGroup } from './buildLeavingMallPageProps';
import type { ItemData } from '@types';

const themeColor = '#CDC1FF';
const rgb = Color(themeColor).rgb().array();

type LeavingMallPageContentProps = {
  title: string;
  description: ReactNode;
  itemsByDate: LeavingMallDateGroup[];
  itemData: ItemData[];
};

export function LeavingMallPageContent({
  title,
  description,
  itemsByDate,
  itemData,
}: LeavingMallPageContentProps) {
  return (
    <>
      <Box
        position="absolute"
        h="650px"
        left="0"
        width="100%"
        bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${rgb[0]},${rgb[1]},${rgb[2]},.8) 70%)`}
        zIndex={-1}
      />
      <Center
        my={6}
        flexFlow="column"
        gap={2}
        css={{ '& a': { color: Color(themeColor).lightness(90).hex() } }}
      >
        <Box h="auto" overflow="hidden" borderRadius="md" boxShadow="md">
          <Image
            w={600}
            h={200}
            objectFit="cover"
            src="https://images.neopets.com/ncmall/shopkeepers/cashshop_new.png"
            alt="NC Mall Thumbnail"
          />
        </Box>
        <Heading as="h1">{title}</Heading>
        <Text>{description}</Text>
      </Center>
      <Separator my={3} />
      <Flex flexFlow="column" alignItems="stretch" flexWrap="wrap" gap={3} mt={3}>
        {itemsByDate.map(({ date, mallData }) => (
          <Flex key={date} flexFlow="column" gap={3}>
            <Heading as="h2" size="lg">
              {date}
            </Heading>
            <HStack gap={3} alignItems="stretch" flexWrap="wrap">
              {mallData.map((mall) => {
                const item = itemData.find((entry) => entry.internal_id === mall.item_iid);
                if (!item) return null;
                return <ItemCard uniqueID="leaving-mall" key={item.internal_id} item={item} />;
              })}
            </HStack>
          </Flex>
        ))}
      </Flex>
    </>
  );
}
