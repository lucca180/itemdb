export type LayoutTranslate = (key: string) => string;

export type LayoutNavOption = {
  label: string;
  href: string;
  trackEventLabel: string;
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
        { label: t('Layout.patch-notes'), href: '/articles', trackEventLabel: 'patch-notes' },
        {
          label: t('Layout.how-to-contribute'),
          href: '/contribute',
          trackEventLabel: 'how-to-contribute',
        },
        {
          label: t('Layout.sort-galleries-by-color'),
          href: '/articles/sort-gallery',
          trackEventLabel: 'sort-gallery',
        },
        {
          label: t('Layout.advanced-search-queries'),
          href: '/articles/advanced-search-queries',
          trackEventLabel: 'advanced-search-queries',
        },
        {
          label: t('Articles.all-articles'),
          href: '/articles',
          trackEventLabel: 'all-articles',
        },
      ],
    },
    {
      label: t('Layout.restock'),
      href: '/restock',
      options: [
        {
          label: t('Layout.restock-dashboard'),
          href: '/restock/dashboard',
          trackEventLabel: 'restock-restock-dashboard',
        },
        {
          label: 'Neopian Fresh Foods',
          href: '/restock/neopian-fresh-foods',
          trackEventLabel: 'neopian-fresh-foods',
        },
        { label: "Cog's Tog", href: '/restock/cogs-togs', trackEventLabel: 'cogs-togs' },
        { label: t('Layout.view-all-shops'), href: '/restock/', trackEventLabel: 'view-all-shops' },
      ],
    },
    {
      label: t('Lists.Lists'),
      href: '/lists/official',
      options: [
        {
          label: t('Layout.import-items-and-checklists'),
          href: '/lists/import',
          trackEventLabel: 'import-items',
        },
        {
          label: t('Layout.dailies-and-freebies'),
          href: '/lists/official/cat/dailies',
          trackEventLabel: 'dailies-and-freebies',
        },
        {
          label: t('Layout.exclusive-clothes'),
          href: '/hub/outfits/acara',
          trackEventLabel: 'exclusive-clothes',
        },
        {
          label: t('General.dynamic-lists'),
          href: '/articles/checklists-and-dynamic-lists',
          trackEventLabel: 'dynamic-lists',
        },
        {
          label: 'Quest Log',
          href: '/lists/official/cat/quest-log',
          trackEventLabel: 'quest-log',
        },
        {
          label: t('Layout.all-official-lists'),
          href: '/lists/official',
          trackEventLabel: 'all-official-lists',
        },
      ],
    },
    {
      label: 'Mall',
      href: '/mall',
      options: [
        {
          label: t('Layout.nc-mall-hub'),
          href: '/mall',
          newUntil: 1788825599000,
          trackEventLabel: 'nc-mall-hub',
        },
        {
          label: t('NcMall.keep-reading-pet-styles'),
          href: '/rainbow-pool/pet-styles',
          trackEventLabel: 'pet-styles',
        },
        {
          label: t('HomePage.leaving-nc-mall'),
          href: '/mall/leaving',
          trackEventLabel: 'leaving-nc-mall',
        },
        {
          label: t('Layout.report-your-nc-trades'),
          href: '/mall/report',
          trackEventLabel: 'mall-report-nc-trades',
        },
        {
          label: t('Layout.import-wishlist'),
          href: '/lists/import/advanced',
          trackEventLabel: 'import-wishlist',
        },
        {
          label: 'NC Trading Guide',
          href: '/articles/nc-trading-guide',
          newUntil: 1788825599000,
          trackEventLabel: 'nc-trading-guide',
        },
        {
          label: t('NcMall.keep-reading-lebron'),
          href: '/articles/lebron',
          trackEventLabel: 'lebron',
        },
      ],
    },
    {
      label: t('Layout.tools'),
      href: '/rainbow-pool',
      options: [
        {
          label: t('Layout.userscripts'),
          href: '/articles/userscripts',
          trackEventLabel: 'userscripts',
        },
        {
          label: 'Price Checker',
          href: '/tools/price-checker',
          newUntil: 1788825600000,
          trackEventLabel: 'price-checker',
        },
        {
          label: t('Layout.rainbow-pool-tool'),
          href: '/rainbow-pool',
          trackEventLabel: 'rainbow-pool',
        },
        {
          label: 'Pet Styles Tokens',
          href: '/rainbow-pool/pet-styles',
          trackEventLabel: 'pet-styles-tokens',
        },
        {
          label: t('Layout.item-effects'),
          href: '/hub/item-effects',
          trackEventLabel: 'item-effects',
        },
        {
          label: t('Layout.restock-dashboard'),
          href: '/restock/dashboard',
          trackEventLabel: 'tools-restock-dashboard',
        },
      ],
    },
    {
      label: t('Layout.contribute'),
      href: '/contribute',
      options: [
        {
          label: 'Item Data Extractor',
          href: '/contribute',
          trackEventLabel: 'item-data-extractor',
        },
        {
          label: t('Layout.missing-info-hub'),
          href: '/hub/missing-info',
          trackEventLabel: 'missing-info-hub',
        },
        {
          label: t('Layout.trade-pricing'),
          href: '/feedback/trades',
          trackEventLabel: 'trade-pricing',
        },
        {
          label: t('Feedback.suggestion-voting'),
          href: '/feedback/vote',
          trackEventLabel: 'suggestion-voting',
        },
        {
          label: t('Layout.feedback-and-ideas'),
          href: '/feedback',
          trackEventLabel: 'feedback-and-ideas',
        },
        {
          label: t('Layout.report-your-nc-trades'),
          href: '/mall/report',
          trackEventLabel: 'contribute-report-nc-trades',
        },
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
