import { Badge, Box, Flex, Heading, HStack, Link, Separator, Text } from '@chakra-ui/react';
import Color from 'color';
import { ItemImageV2 } from '@components/Items/v2/ItemImageV2';
import MainLink from '@components/Utils/MainLink';
import type { ItemV2For } from '@types';
import {
  formatDayMonth,
  formatNcPrice,
  getMallPricing,
  newArrivalCaption,
} from './editorialFormat';
import { ItemStrip, Kicker } from './EditorialPieces';

type EditorialFeatureStoryProps = {
  item: ItemV2For<'card'>;
  alsoNew: ItemV2For<'card'>[];
};

/** Cover story: the biggest visual on the page, followed by the rest of the week's drop. */
export function EditorialFeatureStory({ item, alsoNew }: EditorialFeatureStoryProps) {
  const pricing = getMallPricing(item);
  const accent = Color(item.colorHex ?? '#CDC1FF');
  const wash = accent.alpha(0.4).hexa();
  const glow = accent.lightness(70).alpha(0.35).hexa();

  return (
    <Flex
      direction="column"
      gap={{ base: 5, md: 7 }}
      bg="gray.700"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      p={{ base: 4, md: 8 }}
      bgGradient={`linear-gradient(to bottom, ${wash}, transparent 60%)`}
    >
      <HStack gap={3} flexWrap="wrap">
        <Badge colorPalette="purple" variant="solid">
          Cover story
        </Badge>
        <Kicker color="whiteAlpha.700">
          {pricing?.saleBegin
            ? `New drop · ${formatDayMonth(pricing.saleBegin)}`
            : 'New in the mall'}
        </Kicker>
      </HStack>

      <Flex
        direction={{ base: 'column', md: 'row' }}
        gap={{ base: 5, md: 8 }}
        align={{ base: 'stretch', md: 'center' }}
      >
        <Box
          flexShrink={0}
          alignSelf={{ base: 'center', md: 'flex-start' }}
          w={{ base: '180px', md: '220px' }}
          h={{ base: '180px', md: '220px' }}
          borderRadius="lg"
          bg="blackAlpha.500"
          boxShadow={`0 0 60px ${glow}`}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <ItemImageV2 item={item} width={150} height={150} style={{ objectFit: 'contain' }} />
        </Box>

        <Flex direction="column" gap={4} minW={0} flex={1}>
          <Heading
            as="h2"
            size={{ base: '2xl', md: '3xl', xl: '4xl' }}
            lineHeight="1.05"
            css={{ textWrap: 'balance' }}
          >
            {item.name}
          </Heading>
          <Text
            color="whiteAlpha.800"
            fontSize={{ base: 'sm', md: 'md' }}
            maxW="52ch"
            css={{ textWrap: 'pretty' }}
          >
            {item.description} Priced at{' '}
            {pricing ? formatNcPrice(pricing.price) : 'an unlisted amount'} and stocked alongside
            the rest of this week&apos;s releases.
          </Text>
          <HStack gap={2} flexWrap="wrap">
            {pricing && (
              <Badge colorPalette="purple" variant="solid">
                {formatNcPrice(pricing.price)}
              </Badge>
            )}
            {item.category && <Badge colorPalette="gray">{item.category}</Badge>}
            {item.flags.includes('wearable') && (
              <Badge colorPalette="purple" variant="outline">
                Wearable
              </Badge>
            )}
            {item.ncValue && <Badge colorPalette="yellow">{item.ncValue.range} caps</Badge>}
          </HStack>
          <Link asChild color="purple.200" fontWeight="semibold" w="fit-content">
            <MainLink href={`/item/${item.slug ?? item.internal_id}`}>
              Open the item page →
            </MainLink>
          </Link>
        </Flex>
      </Flex>

      <Separator borderColor="whiteAlpha.200" />

      <Flex direction="column" gap={3}>
        <Flex justify="space-between" align="baseline" gap={4} flexWrap="wrap">
          <Kicker>Also new this week</Kicker>
          <Link asChild fontSize="sm" color="purple.200">
            <MainLink href="/search?type=nc">All NC items →</MainLink>
          </Link>
        </Flex>
        <ItemStrip
          small
          cells={alsoNew.map((entry) => ({ item: entry, caption: newArrivalCaption(entry) }))}
        />
      </Flex>
    </Flex>
  );
}
