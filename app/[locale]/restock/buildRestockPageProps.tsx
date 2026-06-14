import type { ReactNode } from 'react';
import { Link } from '@chakra-ui/react';
import MainLink from '@components/Utils/MainLink';
import type { BreadcrumbItem } from '@components/Breadcrumbs/types';
import { getTranslations } from 'next-intl/server';

export type RestockFaqItem = {
  questionName: string;
  acceptedAnswerText: string;
};

export type RestockPageClientLabels = {
  categoriesLabel: string;
  difficultyLabel: string;
  trendingShopsLabel: string;
};

export type RestockPageLabels = RestockPageClientLabels & {
  breadcrumbList: BreadcrumbItem[];
  title: string;
  callToAction: ReactNode;
  dashboardCta: ReactNode;
  specialDayLabels: {
    hpd: string;
    tyrannia: string;
    usukicon: string;
    festival: string;
    halloween: string;
  };
  faqItems: RestockFaqItem[];
  faqSections: { heading: string; body: ReactNode }[];
};

export async function buildRestockPageProps(): Promise<RestockPageLabels> {
  const t = await getTranslations();

  const faqItems: RestockFaqItem[] = Array.from({ length: 5 }, (_, index) => {
    const i = index + 1;
    return {
      questionName: t(`Restock.faq-${i}`),
      acceptedAnswerText: getRestockFaqAnswerText(t, i),
    };
  });

  return {
    breadcrumbList: [
      { position: 1, name: t('Layout.home'), item: '/' },
      { position: 2, name: t('Restock.restock-hub'), item: '/restock' },
    ],
    title: t('Restock.restock-hub'),
    callToAction: t.rich('Restock.call-to-action', {
      b: (children) => <b>{children}</b>,
    }),
    dashboardCta: t.rich('Restock.dashboard-cta', {
      Link: (chunk) => (
        <Link asChild color="blue.200">
          <MainLink href="/restock/dashboard" prefetch={false}>
            {chunk}
          </MainLink>
        </Link>
      ),
    }),
    specialDayLabels: {
      hpd: t('Restock.half-price-day-all-shops-with-50-off'),
      tyrannia: t('Restock.tyrannian-hub'),
      usukicon: t('Restock.hub-usuki-day'),
      festival: t('Restock.faerie-festival-hub'),
      halloween: t('Restock.halloween-hub'),
    },
    categoriesLabel: t('ItemPage.categories'),
    difficultyLabel: t('Restock.difficulty'),
    trendingShopsLabel: t('Restock.trending-shops'),
    faqItems,
    faqSections: [
      {
        heading: t('Restock.faq-1'),
        body: (
          <>
            {t('Restock.faq-1-text')}
            <br />
            <br />
            {t('Restock.faq-1-text-2')}
          </>
        ),
      },
      { heading: t('Restock.faq-2'), body: t('Restock.faq-2-text') },
      {
        heading: t('Restock.faq-3'),
        body: (
          <>
            {t('Restock.faq-3-text')}
            <br />
            <br />
            {t('Restock.faq-3-text-2')}
          </>
        ),
      },
      { heading: t('Restock.faq-4'), body: t('Restock.faq-4-text') },
      { heading: t('Restock.faq-5'), body: t('Restock.faq-5-text') },
    ],
  };
}

function getRestockFaqAnswerText(
  t: Awaited<ReturnType<typeof getTranslations>>,
  index: number
): string {
  if (index === 1) {
    return `${t('Restock.faq-1-text')}\n\n${t('Restock.faq-1-text-2')}`;
  }
  if (index === 3) {
    return `${t('Restock.faq-3-text')}\n\n${t('Restock.faq-3-text-2')}`;
  }
  return t(`Restock.faq-${index}-text`);
}

export async function buildRestockPageMetadata() {
  const t = await getTranslations();
  return {
    title: t('Restock.neopets-restock-helper'),
    description: t('Restock.restock-description'),
  };
}
