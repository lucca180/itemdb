import type { ReactNode } from 'react';
import { Link as I18nLink } from '@i18n/navigation';
import { Link } from '@chakra-ui/react';
import { getTranslations } from 'next-intl/server';

export type FaqFeatureCard = {
  title: string;
  body: ReactNode;
  icon: 'dynamic' | 'chart' | 'money' | 'search' | 'image' | 'description';
};

export type FaqPageContentProps = {
  whyItemdb: string;
  text1: string;
  whatIsItemdb: string;
  text2: ReactNode;
  text3: ReactNode;
  text4: ReactNode;
  isItSafe: string;
  textIsSafe: ReactNode;
  whyUseItemdb: string;
  coolFeatures: string;
  featureCards: FaqFeatureCard[];
  howCanIHelp: string;
  text11: ReactNode;
  canITalkOnNeopets: string;
  text12: ReactNode;
  missingInfo: string;
  text13: ReactNode;
  text14: ReactNode;
};

export async function buildFaqPageProps(): Promise<FaqPageContentProps> {
  const t = await getTranslations();

  return {
    whyItemdb: t('FAQ.why-itemdb'),
    text1: t('FAQ.text-1'),
    whatIsItemdb: t('FAQ.what-is-the-itemdb'),
    text2: t.rich('FAQ.text-2', {
      Link1: (chunk) => (
        <Link href="https://github.com/lucca180/itemdb/" target="_blank" rel="noreferrer">
          {chunk}
        </Link>
      ),
      Link2: (chunk) => <I18nLink href="/contribute">{chunk}</I18nLink>,
    }),
    text3: t.rich('FAQ.text-3', {
      b: (chunk) => <b>{chunk}</b>,
      Text: (chunk) => (
        <span style={{ color: 'var(--chakra-colors-pink-300)', fontWeight: 'bold' }}>{chunk}</span>
      ),
    }),
    text4: t.rich('FAQ.text-4', {
      Link: (chunk) => <I18nLink href="/terms">{chunk}</I18nLink>,
      Link1: (chunk) => <I18nLink href="/articles/sort-gallery">{chunk}</I18nLink>,
      Link2: (chunk) => (
        <Link href="https://docs.itemdb.com.br" target="_blank" rel="noreferrer">
          {chunk}
        </Link>
      ),
      b: (chunk) => <b>{chunk}</b>,
    }),
    isItSafe: t('FAQ.is-it-safe-i-wont-be-frozen'),
    textIsSafe: t.rich('FAQ.text-is-safe', {
      Link: (chunk) => (
        <Link href="https://www.neopets.com/fansites/index.phtml" target="_blank" rel="noreferrer">
          {chunk}
        </Link>
      ),
      br: () => <br />,
    }),
    whyUseItemdb: t('FAQ.why-use-itemdb'),
    coolFeatures: t('FAQ.we-have-a-lot-of-cool-features-such-as'),
    featureCards: [
      {
        title: t('General.dynamic-lists'),
        icon: 'dynamic',
        body: t.rich('FAQ.text-5', {
          Link: (chunk) => (
            <I18nLink href="/articles/checklists-and-dynamic-lists">{chunk}</I18nLink>
          ),
        }),
      },
      {
        title: t('FAQ.drop-odds'),
        icon: 'chart',
        body: t('FAQ.text-6'),
      },
      {
        title: t('FAQ.owls-integration'),
        icon: 'money',
        body: t.rich('FAQ.text-7', {
          Link: (chunk) => <I18nLink href="/articles/lebron">{chunk}</I18nLink>,
        }),
      },
      {
        title: t('FAQ.powerful-search'),
        icon: 'search',
        body: t.rich('FAQ.text-8', {
          Link: (chunk) => <I18nLink href="/articles/advanced-search-queries">{chunk}</I18nLink>,
        }),
      },
      {
        title: t('FAQ.wearable-preview'),
        icon: 'image',
        body: t.rich('FAQ.text-9', {
          Link: (chunk) => (
            <Link href="https://impress.openneo.net/" target="_blank" rel="noreferrer">
              {chunk}
            </Link>
          ),
        }),
      },
      {
        title: t('Layout.userscripts'),
        icon: 'description',
        body: t.rich('FAQ.text-10', {
          Link: (chunk) => <I18nLink href="/articles/userscripts">{chunk}</I18nLink>,
        }),
      },
    ],
    howCanIHelp: t('FAQ.how-can-i-help'),
    text11: t.rich('FAQ.text-11', {
      Link: (chunk) => <I18nLink href="/contribute">{chunk}</I18nLink>,
    }),
    canITalkOnNeopets: t('FAQ.can-i-talk-about-itemdb-on-neopets'),
    text12: t.rich('FAQ.text-12', {
      Link: (chunk) => (
        <Link href="http://magnetismotimes.com/" target="_blank" rel="noreferrer">
          {chunk}
        </Link>
      ),
    }),
    missingInfo: t('FAQ.you-have-a-lot-of-missing-or-wrong-info'),
    text13: t.rich('FAQ.text-13', {
      Link: (chunk) => <I18nLink href="/contribute">{chunk}</I18nLink>,
    }),
    text14: t.rich('FAQ.text-14', {
      b: (chunk) => <b>{chunk}</b>,
    }),
  };
}
