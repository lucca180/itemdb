/* eslint-disable react/no-unescaped-entities */
import {
  Flex,
  Text,
  Image,
  Badge,
  Center,
  Alert,
  AlertIcon,
  Link,
  HStack,
  Button,
  useDisclosure,
} from '@chakra-ui/react';
import axios from 'axios';
import React, { useEffect, useMemo } from 'react';
import { ItemData, ItemOpenable, PrizePoolData } from '../../types';
import CardBase from '../Card/CardBase';
import ItemCard from './ItemCard';
import NextLink from 'next/link';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { showScriptCTA } from '../../utils/scriptUtils';
import { capInfoIds, capsulesInfo } from '@utils/ncCapsulesInfo';

const OldPoolDrops = dynamic(() => import('../Utils/OldPoolDrops'));
const OfficialOddsModal = dynamic(() => import('../Modal/OfficialOddsModal'));

type Props = {
  item: ItemData;
  itemOpenable: ItemOpenable;
};

const SKIP_ITEMS = [61696, 65743];

const ItemDrops = (props: Props) => {
  const t = useTranslations();
  const [isLoading, setLoading] = React.useState(true);
  const [dropData, setDropData] = React.useState<ItemData[]>([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { item, itemOpenable } = props;

  const color = item.color.rgb;
  const pools = itemOpenable.pools;
  const itemDrops = itemOpenable.drops;
  const multiplePools = Object.keys(pools).filter((a) => !a.includes('old-')).length > 1;
  const isChoice = itemOpenable.isChoice;

  const hasOldPool = Object.keys(pools).some((a) => a.includes('old-'));

  const poolsArr = useMemo(
    () => Object.values(pools).sort((a, b) => (a.isLE ? -1 : a.name.localeCompare(b.name))),
    [pools]
  );

  useEffect(() => {
    if (SKIP_ITEMS.includes(item.internal_id)) return;

    init();
  }, [item.internal_id]);

  const init = async () => {
    const itemRes = await axios.post(`/api/v1/items/many`, {
      id: Object.keys(itemDrops),
    });

    setDropData(Object.values(itemRes.data));
    setLoading(false);
  };

  if (SKIP_ITEMS.includes(item.internal_id)) return null;

  if (isLoading)
    return (
      <CardBase title={t('Drops.item-drops')} color={color}>
        <Flex gap={3} wrap="wrap" justifyContent="center">
          {Object.values(itemDrops).map((item) => (
            <ItemCard uniqueID="" key={item.item_iid} isLoading small />
          ))}
        </Flex>
      </CardBase>
    );

  return (
    <CardBase title={t('Drops.item-drops')} color={color}>
      {isOpen && <OfficialOddsModal isOpen={isOpen} onClose={onClose} />}
      {!itemOpenable.isGBC && <HelpNeeded />}
      {itemOpenable.isGBC && (
        <Alert borderRadius={5} mb={3}>
          <AlertIcon />
          <Text fontSize="sm">{t.rich('Drops.gbc', { b: (text) => <b>{text}</b> })}</Text>
        </Alert>
      )}

      {isChoice && (itemOpenable.minDrop > 1 || itemOpenable.maxDrop > 1) && (
        <Text textAlign={'center'} mb={3} fontSize="sm" color="gray.200">
          <DropText pool={null} itemOpenable={itemOpenable} />
        </Text>
      )}

      {poolsArr
        .filter((a) => !['unknown'].includes(a.name) && !a.name.includes('old-'))
        .sort((a) => (a.isLE ? -1 : 1))
        .map((pool, i) => (
          <DropPool
            key={pool.name}
            pool={pool}
            itemOpenable={itemOpenable}
            item={item}
            dropData={dropData}
            isFirst={i === 0}
            forceOddsText={hasOldPool}
          />
        ))}

      {pools['unknown'] && (
        <DropPool
          pool={pools['unknown']}
          itemOpenable={itemOpenable}
          item={item}
          dropData={dropData}
          hasMultiplePools={multiplePools}
          isFirst={!multiplePools}
          forceOddsText={hasOldPool}
          hideOdds={isChoice}
        />
      )}

      {hasOldPool && (
        <OldPoolDrops
          pools={poolsArr.filter((a) => a.name.includes('old-'))}
          itemOpenable={itemOpenable}
          item={item}
          dropData={dropData}
        />
      )}

      {!isChoice && !!itemOpenable.openings && !hasOldPool && (
        <Text textAlign={'center'} mt={4} fontSize="xs" color="gray.300">
          {t.rich('Drops.item-opening-reports', {
            openings: itemOpenable.openings,
            itemName: item.name,
            Link: (text) => (
              <Link as={NextLink} href="/contribute" color="gray.400">
                {text}
              </Link>
            ),
          })}
        </Text>
      )}
      {item.isNC && (
        <Text textAlign={'center'} mt={2} fontSize="xs" color="gray.400">
          <Link onClick={onOpen}>{t('ItemPage.official-nc-mall-drops')}</Link>
        </Text>
      )}
    </CardBase>
  );
};

export default ItemDrops;

type CatImageProps = {
  cat: string;
  item_iid: number;
};

const CatImage = (props: CatImageProps) => {
  const { cat, item_iid } = props;
  const t = useTranslations();

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
          <Badge fontSize="md">{t('Drops.unknown-categories')}</Badge>
        </Center>
        <Text textAlign={'center'} my={3} fontSize="xs" color="gray.300">
          {t('Drops.unknown-text')}
        </Text>
      </>
    );

  if (url)
    return (
      <Badge as="h3" fontSize="lg" mb={3}>
        {url}
      </Badge>
    );

  return (
    <Badge as="h3" fontSize="md" mb={3}>
      Category {cat}
    </Badge>
  );
};

type DropTextProps = {
  pool: PrizePoolData | null;
  itemOpenable: ItemOpenable;
  isFirst?: boolean;
};

const DropText = ({ pool, itemOpenable, isFirst }: DropTextProps) => {
  const t = useTranslations();
  const isGram = itemOpenable.isGram;

  if (!pool || !pool.isChance || (isGram && !pool.isLE)) {
    const openable = pool ?? itemOpenable;
    const poolName = pool ? (pool.isLE ? 'le' : pool.name) : 'unknown';

    if (openable.maxDrop > 1 && openable.maxDrop !== openable.minDrop)
      return (
        <>
          {t.rich(isGram ? 'Drops.gram-multiple' : 'Drops.multiple', {
            b: (text) => <b>{text}</b>,
            isFirst: isFirst,
            type: poolName,
            min: openable.minDrop,
            max: openable.maxDrop,
          })}
        </>
      );

    return (
      <>
        {t.rich(isGram ? 'Drops.gram-single' : 'Drops.single', {
          b: (text) => <b>{text}</b>,
          isFirst: isFirst,
          type: poolName,
          min: openable.minDrop || openable.maxDrop,
        })}
      </>
    );
  }

  if (pool.isChance && (!isGram || pool.isLE)) {
    if (pool.maxDrop > 1 && pool.maxDrop !== pool.minDrop)
      return (
        <>
          {t.rich('Drops.chance-multiple', {
            b: (text) => <b>{text}</b>,
            isFirst: isFirst,
            min: pool.minDrop,
            max: pool.maxDrop,
            type: pool.isLE ? 'le' : pool.name,
            isGram: isGram,
            chance: pool.openings ? getChance(pool.openings, itemOpenable.openings) : 0,
          })}
        </>
      );

    return (
      <>
        {t.rich('Drops.chance-single', {
          b: (text) => <b>{text}</b>,
          isFirst: isFirst,
          min: pool.minDrop || pool.maxDrop,
          type: pool.isLE ? 'le' : pool.name,
          isGram: isGram,
          chance: pool.openings ? getChance(pool.openings, itemOpenable.openings) : 0,
        })}
      </>
    );
  }

  return null;
};

type DropPoolProps = {
  pool: PrizePoolData;
  itemOpenable: ItemOpenable;
  item: ItemData;
  dropData: ItemData[];
  isFirst?: boolean;
  forceOddsText?: boolean;
  hasMultiplePools?: boolean;
  hideOdds?: boolean;
};

export const DropPool = (props: DropPoolProps) => {
  const { pool, itemOpenable, item, dropData, isFirst, forceOddsText } = props;

  const shouldHideOdds = props.hideOdds
    ? true
    : pool.openings < Math.max(pool.items.length * 2, 10);

  const isChoice = itemOpenable.isChoice;
  const itemDrops = itemOpenable.drops;
  const t = useTranslations();

  return (
    <Flex alignItems="center" key={pool.name} flexFlow="column" mb={3}>
      {isChoice && !pool.isLE && <CatImage cat={pool.name} item_iid={item.internal_id} />}
      {(pool.name === 'bonus' || pool.isLE) && (
        <Alert status="success" variant="subtle" textAlign={'center'} mb={3}>
          <Text textAlign={'center'} fontSize="sm" flex="1">
            <DropText pool={pool} itemOpenable={itemOpenable} />
          </Text>
        </Alert>
      )}
      {!isChoice && pool.name !== 'bonus' && !pool.isLE && (
        <Text textAlign={'center'} fontSize="sm" flex="1" mb={3}>
          <DropText pool={pool} itemOpenable={itemOpenable} isFirst={isFirst} />
        </Text>
      )}
      <Flex gap={3} wrap="wrap" justifyContent="center">
        {pool.items
          .map((a) => itemDrops[a])
          .sort((a, b) => b.dropRate - a.dropRate)
          .map((drop) => {
            const item = dropData.find((a) => drop.item_iid === a.internal_id);
            if (!item) return null;
            return (
              <ItemCard
                uniqueID={`drop-${pool.name}`}
                key={`drop-${pool.name}-${item.internal_id}`}
                item={item}
                disablePrefetch
                small
                odds={!shouldHideOdds ? drop.dropRate : undefined}
                isLE={drop.isLE}
              />
            );
          })}
      </Flex>
      {((isChoice && !pool.isLE) || forceOddsText) && (
        <Text textAlign={'center'} mt={4} fontSize="xs" color="gray.300">
          {t.rich('Drops.pool-opening-reports', {
            b: (text) => <b>{text}</b>,
            openings: pool.openings,
            Link: (text) => (
              <Link as={NextLink} href="/contribute" color="gray.400">
                {text}
              </Link>
            ),
          })}
        </Text>
      )}
    </Flex>
  );
};

const HelpNeeded = () => {
  const t = useTranslations();
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
        {t('ItemPage.drops-script-cta')}
      </Text>
      <Text fontSize="sm" color="whiteAlpha.900" maxW="500px" sx={{ textWrap: 'pretty' }}>
        {t.rich('ItemPage.drops-script-cta-text', {
          b: (text) => <b>{text}</b>,
        })}
      </Text>
      <HStack mt={1}>
        <Button
          as={Link}
          size="sm"
          href="https://github.com/lucca180/itemdb/raw/main/userscripts/itemDataExtractor.user.js"
          isExternal
          data-umami-event="help-needed"
          data-umami-event-label="install"
        >
          {t('Restock.install-now')}
        </Button>
        <Button
          as={Link}
          size="sm"
          href="/contribute"
          isExternal
          data-umami-event="help-needed"
          data-umami-event-label="learn-more"
        >
          {t('General.learn-more')}
        </Button>
      </HStack>
    </Flex>
  );
};

const getChance = (openings: number, totalOpenings: number): string => {
  if (totalOpenings === 0) return '0';
  const chance = ((openings / totalOpenings) * 100).toFixed(2);
  if (chance === '100.00') return '0';

  return chance;
};
