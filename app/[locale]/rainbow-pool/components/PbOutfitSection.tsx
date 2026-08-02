import { Badge, Flex, Text } from '@chakra-ui/react';
import ItemRowV2 from '@components/Items/v2/ItemRowV2';
import type { ItemV2For } from '@types';

type PbOutfitSectionProps = {
  items: ItemV2For<'card'>[];
  label: string;
  hint?: string;
};

/** Lists PB pieces for the combo; clothed preview lives in the main pet toggle. */
export function PbOutfitSection({ items, label, hint }: PbOutfitSectionProps) {
  if (!items.length) return null;

  return (
    <Flex
      flexFlow="column"
      gap={2}
      p={3}
      bg="blackAlpha.400"
      borderRadius="lg"
      w="100%"
      align={{ base: 'center', md: 'flex-start' }}
      textAlign={{ base: 'center', md: 'start' }}
    >
      <Badge colorPalette="yellow">{label}</Badge>
      {hint && (
        <Text fontSize="xs" color="whiteAlpha.700" css={{ textWrap: 'pretty' }}>
          {hint}
        </Text>
      )}
      <Flex flexFlow="column" gap={1.5} w="100%">
        {items.map((item) => (
          <ItemRowV2 uniqueID="pb-outfit" key={item.internal_id} item={item} />
        ))}
      </Flex>
    </Flex>
  );
}
