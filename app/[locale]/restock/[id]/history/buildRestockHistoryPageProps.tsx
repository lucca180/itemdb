import type { ReactNode } from 'react';
import { Image, Link, Text } from '@chakra-ui/react';
import { createRestockBreadcrumbList } from '@components/Breadcrumbs/RestockBreadcrumb';
import type { BreadcrumbItem } from '@components/Breadcrumbs/types';
import type { RestockHeaderSpecialDayLabels } from '@components/Hubs/Restock/RestockHeader';
import { Link as I18nLink } from '@i18n/navigation';
import { getTranslations } from 'next-intl/server';
import type { ShopInfo } from '@types';
import { slugify } from '@utils/utils';

export type RestockHistoryClientLabels = {
  modeOptions: { value: string; label: string }[];
  priceOrder: string;
  chronologicalOrder: string;
  historyEmpty: string;
  infoUpToDateWarning: string;
  learnHelp: string;
};

export type RestockHistoryPageLabels = RestockHistoryClientLabels & {
  breadcrumbList: BreadcrumbItem[];
  headerContent: ReactNode;
  historyBadge: string;
  metaDescription: string;
  specialDayLabels: RestockHeaderSpecialDayLabels;
};

export async function buildRestockHistoryPageProps(
  shopInfo: ShopInfo
): Promise<RestockHistoryPageLabels> {
  const t = await getTranslations();

  const metaDescription = String(
    t.rich('Restock.restock-history-header', {
      Link: (chunk) => chunk,
      shopname: shopInfo.name,
    }) ?? ''
  );

  return {
    breadcrumbList: createRestockBreadcrumbList(shopInfo, t, true),
    historyBadge: t('Restock.restock-history'),
    metaDescription,
    headerContent: (
      <Text as="h2" textAlign="center">
        {t.rich('Restock.restock-history-header', {
          Link: (chunk) => (
            <Link
              href={`https://www.neopets.com/objects.phtml?type=shop&obj_type=${shopInfo.id}`}
              target="_blank"
              rel="noreferrer"
            >
              {chunk}
              <Image
                src="/icons/neopets.png"
                width="16px"
                height="16px"
                style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '0.2rem' }}
                alt="link icon"
              />
            </Link>
          ),
          shopname: shopInfo.name,
        })}
        <br />
        <Link asChild>
          <I18nLink href={`/restock/${slugify(shopInfo.name)}`}>
            {t('Restock.restock-history-hub-cta')}
            <Image
              src="/favicon.svg"
              width="18px"
              height="18px"
              style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '0.2rem' }}
              alt="link icon"
            />
          </I18nLink>
        </Link>
      </Text>
    ),
    specialDayLabels: {
      hpd: t('Restock.half-price-day'),
      tyrannia: t('Restock.tyrannian-victory-day'),
      usukicon: t('Restock.usuki-day'),
      festival: t('Restock.faerie-festival'),
      halloween: t('Restock.halloween'),
    },
    modeOptions: [
      { value: '30days', label: t('General.x-days', { x: 30, long: 'false' }) },
      { value: '7days', label: t('General.x-days', { x: 7, long: 'false' }) },
      { value: '3days', label: t('General.x-days', { x: 3, long: 'false' }) },
      { value: '1day', label: t('General.1-day') },
      { value: '1hour', label: t('General.1-hour') },
      { value: '30min', label: t('General.x-minutes', { x: 30, long: 'false' }) },
    ],
    priceOrder: t('Restock.price-order'),
    chronologicalOrder: t('Restock.chronological-order'),
    historyEmpty: t('Restock.history-empty'),
    infoUpToDateWarning: t('Restock.info-up-to-date-warning'),
    learnHelp: t('General.learnHelp'),
  };
}

export async function buildRestockHistoryPageMetadata(shopInfo: ShopInfo) {
  const labels = await buildRestockHistoryPageProps(shopInfo);
  const t = await getTranslations();

  return {
    title: `${shopInfo.name} | ${t('Restock.restock-history')}`,
    description: labels.metaDescription,
  };
}
