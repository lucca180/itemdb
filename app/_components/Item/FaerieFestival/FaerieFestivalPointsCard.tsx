import type { ReactNode } from 'react';
import { Box, Flex, Image, Link, Text } from '@chakra-ui/react';
import { getTranslations } from 'next-intl/server';
import type { ItemData } from '@types';
import CardBase from '@components/Card/CardBase';
import MainLink from '@components/Utils/MainLink';
import { rarityToCCPoints } from '@utils/utils';

/** Matches the Faerie Festival hub accent (app/[locale]/tools/price-checker/priceCheckerTheme.ts). */
const ACCENT = '#e85fb0';
const ACCENT_LIGHT = '#f6a8d6';
const FF_ICON_URL =
  'https://images.neopets.com/homepage/marquee/icons/faeriefestival_event_icon.png';

type Props = {
  item: Pick<ItemData, 'internal_id' | 'rarity' | 'isNC'>;
};

type Translate = Awaited<ReturnType<typeof getTranslations>>;

export default async function FaerieFestivalPointsCard({ item }: Props) {
  if (item.isNC) return null;

  const t = await getTranslations();

  return (
    <CardBase
      title={
        <Link asChild color="white" _hover={{ textDecoration: 'none' }}>
          <MainLink href="/hub/faeriefestival" trackEvent="ff-points-card" trackEventLabel="title">
            {t('ItemPage.ff-card-title')}
          </MainLink>
        </Link>
      }
      color={ACCENT}
      noPadding
    >
      <Flex direction="column">
        <Flex align="center" gap={3} p={3} borderBottom="1px solid" borderColor="whiteAlpha.200">
          <Image src={FF_ICON_URL} alt="" boxSize="40px" />
          <Box flex="1">
            <PointsSummary item={item} t={t} />
          </Box>
        </Flex>
        <Flex direction="column">
          <LinkRow href="/hub/faeriefestival" trackEventLabel="row-hub">
            {t('ItemPage.ff-card-donation-guide')}
          </LinkRow>
          <LinkRow href="/tools/price-checker" trackEventLabel="row-price-checker">
            {t('ItemPage.ff-card-price-checker')}
          </LinkRow>
        </Flex>
      </Flex>
    </CardBase>
  );
}

function PointsSummary({ item, t }: Props & { t: Translate }) {
  if (item.rarity == null) {
    return (
      <Text fontSize="sm" color="gray.300">
        {t('ItemPage.ff-card-rarity-unknown')}
      </Text>
    );
  }

  const points = rarityToCCPoints(item);
  if (!points) {
    return (
      <Text fontSize="sm" color="gray.300">
        {t('ItemPage.ff-card-ineligible', { rarity: item.rarity })}
      </Text>
    );
  }

  return (
    <>
      <Text fontSize="2xl" fontWeight="black" lineHeight={1} color={ACCENT_LIGHT}>
        {t('ItemPage.ff-card-points', { points })}
      </Text>
      <Text fontSize="xs" color="gray.400">
        {t('ItemPage.ff-card-rarity', { rarity: item.rarity })}
      </Text>
    </>
  );
}

function LinkRow({
  href,
  trackEventLabel,
  children,
}: {
  href: string;
  trackEventLabel: string;
  children: ReactNode;
}) {
  return (
    <Link asChild display="block" _hover={{ bg: 'whiteAlpha.100', textDecoration: 'none' }}>
      <MainLink href={href} trackEvent="ff-points-card" trackEventLabel={trackEventLabel}>
        <Flex align="center" justify="space-between" px={3} py={2}>
          <Text fontSize="sm">{children}</Text>
          <Box aria-hidden color="gray.400">
            ›
          </Box>
        </Flex>
      </MainLink>
    </Link>
  );
}
