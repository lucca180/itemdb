'use client';

import { Flex, Text, Image, Badge, Center, Alert, Link, HStack, Button } from '@chakra-ui/react';
import ItemCard from '@components/Items/ItemCard';
import MainLink from '@components/Utils/MainLink';
import { showScriptCTA } from '@utils/scriptUtils';
import { capInfoIds, capsulesInfo } from '@utils/ncCapsulesInfo';
import type {
  HelpNeededLabels,
  PoolTextData,
} from '@app/_components/Item/Drops/buildItemDropsContentProps';
import type { ItemData, ItemOpenable, PrizePoolData } from '@types';

type UnknownCategoryLabels = {
  categories: string;
  text: string;
};

type CatImageProps = {
  cat: string;
  item_iid: number;
  unknownLabels: UnknownCategoryLabels;
};

const CatImage = (props: CatImageProps) => {
  const { cat, item_iid, unknownLabels } = props;

  let url = '';

  if (cat === 'trinkets') url = `https://images.neopets.com/ncmall/buttons/bg_${cat}.png`;
  else if (['accessories', 'clothing'].includes(cat))
    url = `https://images.neopets.com/ncmall/buttons/${cat}.png`;

  if (cat.match(/cat\d+y\d+/gim)) {
    const [catId, catY] = cat.toLowerCase().split('y');
    url = `https://images.neopets.com/ncmall/buttons/altador_years_${catId}_y${catY}.png`;
  }

  if (url)
    return <Image h={'60px'} w={'269px'} objectFit="cover" src={url} alt={`${cat} image`} mb={3} />;

  if (capInfoIds.includes(item_iid)) {
    const info = capsulesInfo[item_iid];
    const catText = info[cat as `cat${number}`]?.text ?? cat;
    if (catText && catText !== 'unknown')
      return (
        <Badge as="h3" fontSize="lg" mb={3}>
          {catText}
        </Badge>
      );
  }

  if (cat === 'unknown')
    return (
      <>
        <Center>
          <Badge fontSize="md">{unknownLabels.categories}</Badge>
        </Center>
        <Text textAlign={'center'} my={3} fontSize="xs" color="gray.300">
          {unknownLabels.text}
        </Text>
      </>
    );

  return (
    <Badge as="h3" fontSize="md" mb={3}>
      Category {cat}
    </Badge>
  );
};

type DropPoolProps = {
  pool: PrizePoolData;
  itemOpenable: ItemOpenable;
  item: ItemData;
  dropData: ItemData[];
  poolText: PoolTextData;
  unknownLabels: UnknownCategoryLabels;
  hideOdds?: boolean;
};

export const DropPool = (props: DropPoolProps) => {
  const { pool, itemOpenable, item, dropData, poolText, unknownLabels } = props;

  const shouldHideOdds = props.hideOdds
    ? true
    : pool.openings < Math.max(pool.items.length * 2, 10);

  const isChoice = itemOpenable.isChoice;
  const itemDrops = itemOpenable.drops;

  return (
    <Flex alignItems="center" key={pool.name} flexFlow="column" mb={3}>
      {isChoice && !pool.isLE && (
        <CatImage cat={pool.name} item_iid={item.internal_id} unknownLabels={unknownLabels} />
      )}
      {(pool.name === 'bonus' || pool.isLE) && poolText.alertDropText && (
        <Alert.Root status="success" variant="subtle" textAlign={'center'} mb={3}>
          <Alert.Content>
            <Text textAlign={'center'} fontSize="sm" flex="1">
              {poolText.alertDropText}
            </Text>
          </Alert.Content>
        </Alert.Root>
      )}
      {poolText.mainDropText && (
        <Text textAlign={'center'} fontSize="sm" flex="1" mb={3}>
          {poolText.mainDropText}
        </Text>
      )}
      <Flex gap={3} wrap="wrap" justifyContent="center">
        {pool.items
          .map((a) => itemDrops[a])
          .sort((a, b) => b.dropRate - a.dropRate)
          .map((drop) => {
            const dropItem = dropData.find((a) => drop.item_iid === a.internal_id);
            if (!dropItem) return null;
            return (
              <ItemCard
                uniqueID={`drop-${pool.name}`}
                key={`drop-${pool.name}-${dropItem.internal_id}`}
                item={dropItem}
                disablePrefetch
                small
                odds={!shouldHideOdds ? drop.dropRate : undefined}
                isLE={drop.isLE}
              />
            );
          })}
      </Flex>
      {poolText.openingReports && (
        <Text textAlign={'center'} mt={4} fontSize="xs" color="gray.300">
          {poolText.openingReports}
        </Text>
      )}
    </Flex>
  );
};

type HelpNeededProps = {
  labels: HelpNeededLabels;
};

export const HelpNeeded = ({ labels }: HelpNeededProps) => {
  const shouldShow = showScriptCTA();

  if (!shouldShow || shouldShow === 'outdated') return null;

  return (
    <Flex
      bg="blackAlpha.600"
      p={2}
      borderRadius={'lg'}
      mb={3}
      flexFlow={'column'}
      alignItems={'center'}
      textAlign={'center'}
      gap={3}
    >
      <Text fontSize="md" color="white" fontWeight={'bold'}>
        {labels.title}
      </Text>
      <Text fontSize="sm" color="whiteAlpha.900" maxW="500px" css={{ textWrap: 'pretty' }}>
        {labels.text}
      </Text>
      <HStack mt={1}>
        <Button asChild size="sm">
          <Link
            href="https://github.com/lucca180/itemdb/raw/main/userscripts/itemDataExtractor.user.js"
            target="_blank"
            rel="noreferrer"
            data-umami-event="help-needed"
            data-umami-event-label="install"
          >
            {labels.installNow}
          </Link>
        </Button>
        <Button asChild size="sm">
          <MainLink href="/contribute" trackEvent="help-needed" trackEventLabel="learn-more">
            {labels.learnMore}
          </MainLink>
        </Button>
      </HStack>
    </Flex>
  );
};

export type { UnknownCategoryLabels };
