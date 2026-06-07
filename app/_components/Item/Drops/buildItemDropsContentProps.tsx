import type { ReactNode } from 'react';
import { Link as I18nLink } from '@i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { renderDropText } from '@app/_components/Item/Drops/renderDropText';
import type { ItemData, ItemOpenable, PrizePoolData } from '@types';

export type HelpNeededLabels = {
  title: string;
  text: ReactNode;
  installNow: string;
  learnMore: string;
};

export type ItemDropsContentLabels = {
  gbc: ReactNode;
  officialNcMallDrops: string;
  itemOpeningReports: ReactNode | null;
  helpNeeded: HelpNeededLabels;
  unknownCategories: string;
  unknownText: string;
};

export type PoolTextData = {
  alertDropText?: ReactNode | null;
  mainDropText?: ReactNode | null;
  openingReports?: ReactNode | null;
};

export type ItemDropsPreparedContent = {
  labels: ItemDropsContentLabels;
  choiceDropText: ReactNode | null;
  poolTexts: Record<string, PoolTextData>;
  oldPoolTitles: string[];
};

function buildPoolOpeningReports(
  t: Awaited<ReturnType<typeof getTranslations>>,
  pool: PrizePoolData
): ReactNode {
  return t.rich('Drops.pool-opening-reports', {
    b: (text) => <b>{text}</b>,
    openings: pool.openings,
    Link: (text) => (
      <I18nLink href="/contribute" style={{ color: 'var(--chakra-colors-gray-400)' }}>
        {text}
      </I18nLink>
    ),
  });
}

function buildPoolTextData(
  t: Awaited<ReturnType<typeof getTranslations>>,
  pool: PrizePoolData,
  itemOpenable: ItemOpenable,
  isFirst: boolean,
  forceOddsText: boolean
): PoolTextData {
  const isChoice = itemOpenable.isChoice;
  const showOpeningReports = (isChoice && !pool.isLE) || forceOddsText;

  return {
    alertDropText:
      pool.name === 'bonus' || pool.isLE ? renderDropText(t, pool, itemOpenable) : null,
    mainDropText:
      !isChoice && pool.name !== 'bonus' && !pool.isLE
        ? renderDropText(t, pool, itemOpenable, isFirst)
        : null,
    openingReports: showOpeningReports ? buildPoolOpeningReports(t, pool) : null,
  };
}

export async function buildItemDropsContentProps(
  item: ItemData,
  itemOpenable: ItemOpenable
): Promise<ItemDropsPreparedContent> {
  const t = await getTranslations();
  const pools = itemOpenable.pools;
  const poolsArr = Object.values(pools).sort((a, b) =>
    a.isLE ? -1 : a.name.localeCompare(b.name)
  );
  const multiplePools = Object.keys(pools).filter((a) => !a.includes('old-')).length > 1;
  const hasOldPool = Object.keys(pools).some((a) => a.includes('old-'));
  const isChoice = itemOpenable.isChoice;
  const forceOddsText = hasOldPool;

  const poolTexts: Record<string, PoolTextData> = {};

  poolsArr
    .filter((a) => !['unknown'].includes(a.name) && !a.name.includes('old-'))
    .sort((a) => (a.isLE ? -1 : 1))
    .forEach((pool, i) => {
      poolTexts[pool.name] = buildPoolTextData(t, pool, itemOpenable, i === 0, forceOddsText);
    });

  if (pools['unknown']) {
    poolTexts.unknown = buildPoolTextData(
      t,
      pools.unknown,
      itemOpenable,
      !multiplePools,
      forceOddsText
    );
  }

  poolsArr
    .filter((a) => a.name.includes('old-'))
    .forEach((pool) => {
      poolTexts[pool.name] = buildPoolTextData(t, pool, itemOpenable, false, forceOddsText);
    });

  const choiceDropText =
    isChoice && (itemOpenable.minDrop > 1 || itemOpenable.maxDrop > 1)
      ? renderDropText(t, null, itemOpenable)
      : null;

  const oldPoolTitles = poolsArr
    .filter((a) => a.name.includes('old-'))
    .map((_, index) => t('ItemPage.old-pool-x', { x: index + 1 }));

  const itemOpeningReports =
    !isChoice && itemOpenable.openings && !hasOldPool
      ? t.rich('Drops.item-opening-reports', {
          openings: itemOpenable.openings,
          itemName: item.name,
          Link: (text) => (
            <I18nLink href="/contribute" style={{ color: 'var(--chakra-colors-gray-400)' }}>
              {text}
            </I18nLink>
          ),
        })
      : null;

  return {
    labels: {
      gbc: t.rich('Drops.gbc', { b: (text) => <b>{text}</b> }),
      officialNcMallDrops: t('ItemPage.official-nc-mall-drops'),
      itemOpeningReports,
      helpNeeded: {
        title: t('ItemPage.drops-script-cta'),
        text: t.rich('ItemPage.drops-script-cta-text', { b: (text) => <b>{text}</b> }),
        installNow: t('Restock.install-now'),
        learnMore: t('General.learn-more'),
      },
      unknownCategories: t('Drops.unknown-categories'),
      unknownText: t('Drops.unknown-text'),
    },
    choiceDropText,
    poolTexts,
    oldPoolTitles,
  };
}
