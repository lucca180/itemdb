import { Flex, Text } from '@chakra-ui/react';
import { RestockLinkPills } from '@components/Hubs/Restock/RestockLinkPills';
import type { ShopInfo } from '@types';
import { slugify } from '@utils/utils';

type PracticePopularShopsProps = {
  title: string;
  shops: ShopInfo[];
};

export function PracticePopularShops({ title, shops }: PracticePopularShopsProps) {
  if (!shops.length) return null;

  return (
    <Flex as="section" flexFlow="column" align="center" gap={3} mt={8}>
      <Text fontWeight="bold">{title}</Text>
      <RestockLinkPills
        trackEvent="restock-practice-popular-shops"
        pills={shops.map((shop) => ({
          id: slugify(shop.name),
          href: `/restock/${slugify(shop.name)}/practice`,
          label: shop.name,
        }))}
      />
    </Flex>
  );
}
