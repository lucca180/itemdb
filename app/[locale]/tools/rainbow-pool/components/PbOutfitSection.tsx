import { Badge, Flex, Text } from '@chakra-ui/react';
import ItemCard from '@components/Items/ItemCard';
import type { ItemData } from '@types';

type PbOutfitSectionProps = {
  items: ItemData[];
  label: string;
  hint?: string;
};

/** Lists PB pieces for the combo; clothed preview lives in the main pet toggle. */
export function PbOutfitSection({ items, label, hint }: PbOutfitSectionProps) {
  if (!items.length) return null;

  return (
    <Flex
      flexFlow="column"
      gap={3}
      p={3}
      bg="blackAlpha.400"
      borderRadius="lg"
      w="100%"
      align="flex-start"
    >
      <Badge colorPalette="yellow">{label}</Badge>
      {hint && (
        <Text fontSize="xs" color="whiteAlpha.700" css={{ textWrap: 'pretty' }}>
          {hint}
        </Text>
      )}
      <Flex flexWrap="wrap" gap={2} w="100%" justify={{ base: 'center', sm: 'flex-start' }}>
        {items.map((item) => (
          <ItemCard uniqueID="pb-outfit" small key={item.internal_id} item={item} />
        ))}
      </Flex>
    </Flex>
  );
}
