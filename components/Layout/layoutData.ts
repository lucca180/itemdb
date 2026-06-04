export type LayoutTranslate = (key: string) => string;

export type LayoutNavOption = {
  label: string;
  href: string;
  newUntil?: number;
};

export type LayoutNavSection = {
  label: string;
  href: string;
  options?: LayoutNavOption[];
};

export type LayoutFooterLink = {
  label: string;
  href: string;
  isExternal?: boolean;
  trackEventLabel: string;
};

export type LayoutFooterColumn = {
  title: string;
  links: LayoutFooterLink[];
};

export function getLayoutNavSections(t: LayoutTranslate): LayoutNavSection[] {
  return [
    { label: t('Layout.home'), href: '/' },
    {
      label: t('Layout.articles'),
      href: '/articles',
      options: [
        { label: t('Layout.userscripts'), href: '/articles/userscripts' },
        { label: 'The Void Within', href: '/hub/the-void-within' },
        { label: t('Layout.patch-notes'), href: '/articles' },
        { label: t('Layout.how-to-contribute'), href: '/contribute' },
        { label: t('Layout.sort-galleries-by-color'), href: '/articles/sort-gallery' },
        {
          label: t('Layout.advanced-search-queries'),
          href: '/articles/advanced-search-queries',
        },
      ],
    },
    {
      label: t('Layout.restock'),
      href: '/restock',
      options: [
        { label: t('Layout.restock-dashboard'), href: '/restock/dashboard' },
        { label: 'Neopian Fresh Foods', href: '/restock/neopian-fresh-foods' },
        { label: "Cog's Tog", href: '/restock/cogs-togs' },
        {
          label: t('Restock.restock-history'),
          href: '/restock/neopian-fresh-foods/history',
        },
        { label: t('Layout.view-all-shops'), href: '/restock/' },
      ],
    },
    {
      label: t('Lists.Lists'),
      href: '/lists/official',
      options: [
        { label: t('Layout.import-items-and-checklists'), href: '/lists/import' },
        { label: t('Layout.dailies-and-freebies'), href: '/lists/official/cat/dailies' },
        {
          label: t('Layout.exclusive-clothes'),
          href: '/hub/outfits/aisha',
          newUntil: 1748735999000,
        },
        { label: t('General.dynamic-lists'), href: '/articles/checklists-and-dynamic-lists' },
        { label: t('HomePage.leaving-nc-mall'), href: '/mall/leaving' },
        { label: 'Quest Log', href: '/lists/official/cat/quest-log' },
        { label: t('Layout.all-official-lists'), href: '/lists/official' },
      ],
    },
    {
      label: t('Layout.tools'),
      href: '/tools/rainbow-pool',
      options: [
        { label: t('Layout.sdb-pricer'), href: '/articles/userscripts' },
        { label: t('Layout.userscripts'), href: '/articles/userscripts' },
        { label: t('Layout.rainbow-pool-tool'), href: '/tools/rainbow-pool' },
        { label: t('Layout.item-effects'), href: '/hub/item-effects' },
        { label: t('Layout.restock-dashboard'), href: '/restock/dashboard' },
        { label: t('Calculator.pricing-calculator'), href: '/tools/price-calculator' },
      ],
    },
    {
      label: t('Layout.contribute'),
      href: '/contribute',
      options: [
        { label: 'Item Data Extractor', href: '/contribute' },
        { label: t('Layout.missing-info-hub'), href: '/hub/missing-info' },
        { label: t('Layout.trade-pricing'), href: '/feedback/trades' },
        { label: t('Feedback.suggestion-voting'), href: '/feedback/vote' },
        { label: t('Layout.feedback-and-ideas'), href: '/feedback' },
        { label: t('Layout.report-your-nc-trades'), href: '/mall/report' },
      ],
    },
  ];
}

export function getLayoutFooterColumns(t: LayoutTranslate): LayoutFooterColumn[] {
  return [
    {
      title: t('Layout.resources'),
      links: [
        { label: 'Lebron', href: '/articles/lebron', trackEventLabel: 'lebron' },
        {
          label: t('Layout.devs'),
          href: 'https://docs.itemdb.com.br',
          isExternal: true,
          trackEventLabel: 'api-docs',
        },
        {
          label: t('Layout.official-lists'),
          href: '/lists/official',
          trackEventLabel: 'official-lists',
        },
        {
          label: t('Layout.userscripts'),
          href: '/articles/userscripts',
          trackEventLabel: 'userscripts',
        },
        { label: t('Layout.public-data'), href: '/public-data', trackEventLabel: 'public-data' },
      ],
    },
    {
      title: t('Layout.contribute'),
      links: [
        { label: 'Item Data Extractor', href: '/contribute', trackEventLabel: 'contribute' },
        {
          label: t('Feedback.vote-suggestions'),
          href: '/feedback/vote',
          trackEventLabel: 'vote',
        },
        {
          label: t('Layout.trade-pricing'),
          href: '/feedback/trades',
          trackEventLabel: 'trade-pricing',
        },
        { label: `+ ${t('Layout.more')}`, href: '/contribute', trackEventLabel: 'more' },
      ],
    },
    {
      title: 'itemdb',
      links: [
        {
          label: `${t('Layout.privacy-policy')} (Feb 2026)`,
          href: '/privacy',
          trackEventLabel: 'privacy-policy',
        },
        {
          label: t('Layout.terms-of-use'),
          href: '/terms',
          trackEventLabel: 'terms-of-use',
        },
        {
          label: t('Feedback.contact-us'),
          href: '/feedback',
          trackEventLabel: 'contact-us',
        },
        {
          label: t('Layout.source-code'),
          href: 'https://github.com/lucca180/itemdb/',
          isExternal: true,
          trackEventLabel: 'source-code',
        },
      ],
    },
  ];
}
