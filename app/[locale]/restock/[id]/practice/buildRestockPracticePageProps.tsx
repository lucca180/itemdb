import { createRestockBreadcrumbList } from '@components/Breadcrumbs/RestockBreadcrumb';
import type { BreadcrumbItem } from '@components/Breadcrumbs/types';
import type { RestockHeaderSpecialDayLabels } from '@components/Hubs/Restock/RestockHeader';
import { getTranslations } from 'next-intl/server';
import { getRestockShopPathname } from '@app/utils/resolveRestockShopRoute';
import type { ShopInfo } from '@types';

export type RestockPracticeFaqItem = {
  question: string;
  answer: string;
};

export type RestockPracticePageLabels = {
  badge: string;
  intro: string;
  guidePill: string;
  dashboardPill: string;
  breadcrumbList: BreadcrumbItem[];
  specialDayLabels: RestockHeaderSpecialDayLabels;
  faqTitle: string;
  faqItems: RestockPracticeFaqItem[];
};

const FAQ_COUNT = 6;

export const getRestockPracticePathname = (shopInfo: ShopInfo) =>
  `${getRestockShopPathname(shopInfo)}/practice` as const;

export async function buildRestockPracticePageProps(
  shopInfo: ShopInfo
): Promise<RestockPracticePageLabels> {
  const t = await getTranslations();
  const shopname = shopInfo.name;

  const breadcrumbList = createRestockBreadcrumbList(shopInfo, t);
  breadcrumbList.push({
    position: breadcrumbList.length + 1,
    name: t('Restock.practice-mode'),
    item: getRestockPracticePathname(shopInfo),
  });

  return {
    badge: t('Restock.practice-mode'),
    intro: t('Restock.practice-intro', { shopname }),
    guidePill: t('Restock.practice-intro-guide'),
    dashboardPill: t('Restock.practice-intro-dashboard'),
    breadcrumbList,
    specialDayLabels: {
      hpd: t('Restock.half-price-day'),
      tyrannia: t('Restock.tyrannian-victory-day'),
      usukicon: t('Restock.usuki-day'),
      festival: t('Restock.faerie-festival'),
      halloween: t('Restock.halloween'),
    },
    faqTitle: t('Restock.practice-faq-title'),
    faqItems: Array.from({ length: FAQ_COUNT }, (_, index) => ({
      question: t(`Restock.practice-faq-${index + 1}`, { shopname }),
      answer: t(`Restock.practice-faq-${index + 1}-text`, { shopname }),
    })),
  };
}

export async function buildRestockPracticePageMetadata(shopInfo: ShopInfo) {
  const t = await getTranslations();

  return {
    title: t('Restock.practice-meta-title', { shopname: shopInfo.name }),
    description: t('Restock.practice-meta-description', { shopname: shopInfo.name }),
  };
}
