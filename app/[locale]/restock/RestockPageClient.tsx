'use client';

import { Button, Flex, Heading, HStack, Text } from '@chakra-ui/react';
import ShopCard from '@components/Hubs/Restock/ShopCard';
import { restockShopInfo } from '@utils/utils';
import type { ShopInfo } from '@types';
import { Fragment, useState } from 'react';
import type { RestockPageClientLabels } from './buildRestockPageProps';

const allCats = [
  ...new Set(
    Object.values(restockShopInfo)
      .map((shop) => shop.category)
      .flat()
  ),
].sort((a, b) => a.localeCompare(b));

type RestockPageClientProps = {
  labels: RestockPageClientLabels;
  trendingShops: ShopInfo[];
};

export function RestockPageClient({ labels, trendingShops }: RestockPageClientProps) {
  const [selCats, setSelCats] = useState<string[]>([]);
  const [selDiff, setSelDiff] = useState<string[]>([]);

  const handleCat = (cat: string) => {
    setSelCats((current) =>
      current.includes(cat) ? current.filter((entry) => entry !== cat) : [...current, cat]
    );
  };

  const handleDiff = (diff: string) => {
    setSelDiff((current) =>
      current.includes(diff) ? current.filter((entry) => entry !== diff) : [...current, diff]
    );
  };

  return (
    <>
      <HStack my={3} justifyContent="space-between" flexWrap="wrap">
        <HStack flexWrap="wrap">
          <Text fontSize="sm">{labels.categoriesLabel}:</Text>
          {allCats.map((cat) => (
            <Button
              size="sm"
              key={cat}
              colorPalette={selCats.includes(cat) ? 'cyan' : undefined}
              onClick={() => handleCat(cat)}
            >
              {cat}
            </Button>
          ))}
        </HStack>
        <HStack flexWrap="wrap">
          <Text fontSize="sm">{labels.difficultyLabel}:</Text>
          {['Beginner', 'Medium', 'Advanced'].map((diff) => (
            <Button
              size="sm"
              key={diff}
              colorPalette={
                selDiff.includes(diff)
                  ? diff === 'Beginner'
                    ? 'green'
                    : diff === 'Advanced'
                      ? 'red'
                      : 'cyan'
                  : undefined
              }
              onClick={() => handleDiff(diff)}
            >
              {diff === 'Medium' ? 'Normal' : diff}
            </Button>
          ))}
        </HStack>
      </HStack>
      <Flex flexFlow="column" flexWrap="wrap" gap={5} justifyContent="center" mb={10}>
        {selCats.length === 0 && selDiff.length === 0 && (
          <>
            <Heading as="h2" size="lg">
              {labels.trendingShopsLabel}
            </Heading>
            <Flex flexFlow="row" flexWrap="wrap" gap={3} justifyContent="center">
              {trendingShops.map((shop) => (
                <ShopCard key={`${shop.id}_trending`} shop={shop} />
              ))}
            </Flex>
          </>
        )}
        {(selCats.length > 0 ? selCats : allCats).map((cat) => {
          const shops = Object.values(restockShopInfo).filter(
            (shop) =>
              (selDiff.length > 0 ? selDiff.includes(shop.difficulty) : true) &&
              shop.category === cat &&
              Number(shop.id) > 0
          );
          if (shops.length === 0) return null;
          return (
            <Fragment key={cat}>
              <Heading as="h2" size="lg">
                {cat}
              </Heading>
              <Flex flexFlow="row" flexWrap="wrap" gap={3} justifyContent="center">
                {shops.map((shop) => (
                  <ShopCard key={shop.id} shop={shop} />
                ))}
              </Flex>
            </Fragment>
          );
        })}
      </Flex>
    </>
  );
}
