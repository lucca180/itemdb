import type { StaticImageData } from 'next/image';

/** Accent for the /tools page header and nav color. */
export const TOOLS_ACCENT = '#C53030';

export type ToolCategoryId = 'prices' | 'pets' | 'restock' | 'lists' | 'nc' | 'contribute';

export type ToolTag = 'new';

/** Name and description come from `Tools.<id>` and `Tools.<id>-description`. */
export type ToolInfo = {
  id: string;
  href: string;
  image: string | StaticImageData;
  /** Width / height of wide images (e.g. 3 for 600x200 shopkeeper banners), so we request enough pixels. */
  imageRatio?: number;
  color: string;
  category: ToolCategoryId;
  tags?: ToolTag[];
};

/** Name and description come from `Tools.category-<id>` and `Tools.category-<id>-description`. */
export type ToolCategory = {
  id: ToolCategoryId;
  color: string;
};

export const toolCategories: ToolCategory[] = [
  { id: 'prices', color: '#ECC94B' },
  { id: 'pets', color: '#75b6a4' },
  { id: 'restock', color: '#79dbaf' },
  { id: 'lists', color: '#e9a23b' },
  { id: 'nc', color: '#CDC1FF' },
  { id: 'contribute', color: '#4974F5' },
];

export const tools: ToolInfo[] = [
  {
    id: 'price-checker',
    href: '/tools/price-checker',
    image: 'https://images.neopets.com/nt/ntimages/128_bruce_ring.gif',
    color: '#65855B',
    category: 'prices',
    tags: ['new'],
  },
  {
    id: 'sdb-pricer',
    href: '/articles/userscripts',
    image: 'https://images.neopets.com/nt/nt_images/621_zaira_icecaves.gif',
    color: '#3697bf',
    category: 'prices',
  },
  {
    id: 'advanced-search',
    href: '/search',
    image: 'https://images.neopets.com/nt/ntimages/94_acara_type.gif',
    color: '#4A5568',
    category: 'prices',
  },
  {
    id: 'rainbow-pool',
    href: '/rainbow-pool',
    image: 'https://images.neopets.com/faerieland/rainbowfountain2_old.gif',
    color: '#75b6a4',
    category: 'pets',
  },
  {
    id: 'pet-styles',
    href: '/rainbow-pool/pet-styles',
    image: 'https://images.neopets.com/ncmall/ui/assets/specialty-stylingstudio-icon-zL9sgg97.png',
    imageRatio: 667 / 375,
    color: '#CDC1FF',
    category: 'pets',
  },
  {
    id: 'exclusive-clothes',
    href: '/hub/outfits/acara',
    image: 'https://images.neopets.com/nt/ntimages/473_unis_clothing.gif',
    color: '#94aefa',
    category: 'pets',
  },
  {
    id: 'item-effects',
    href: '/hub/item-effects',
    image: 'https://images.neopets.com/nt/ntimages/109_jhudora_spell.gif',
    color: '#f86dba',
    category: 'pets',
  },
  {
    id: 'restock-hub',
    href: '/restock',
    image: 'https://images.neopets.com/ncmall/shopkeepers/cashshop_limited.png',
    imageRatio: 3,
    color: '#A5DAE9',
    category: 'restock',
  },
  {
    id: 'restock-simulator',
    href: '/restock/neopian-fresh-foods/practice',
    image: 'https://images.neopets.com/nt/ntimages/307_gelert_coffee.gif',
    color: '#79dbaf',
    category: 'restock',
    tags: ['new'],
  },
  {
    id: 'restock-dashboard',
    href: '/restock/dashboard',
    image: 'https://images.neopets.com/nt/ntimages/484_stockmarket_acara.gif',
    color: '#79dbaf',
    category: 'restock',
  },
  {
    id: 'import-checklists',
    href: '/lists/import',
    image: 'https://images.neopets.com/nt/ntimages/351_lenny_stamps.gif',
    color: '#e9a23b',
    category: 'lists',
  },
  {
    id: 'dynamic-lists',
    href: '/articles/checklists-and-dynamic-lists',
    image: 'https://images.neopets.com/nt/ntimages/79_aisha_dream.gif',
    color: '#e9a23b',
    category: 'lists',
  },
  {
    id: 'sort-gallery',
    href: '/articles/sort-gallery',
    image: 'https://images.neopets.com/nt/ntimages/125_rainbow_paintbrush.jpg',
    color: '#e9a23b',
    category: 'lists',
  },
  {
    id: 'mall-hub',
    href: '/mall',
    image: 'https://images.neopets.com/nt/ntimages/376_nc_mall.gif',
    color: '#CDC1FF',
    category: 'nc',
  },
  {
    id: 'lebron',
    href: '/articles/lebron',
    image: 'https://images.neopets.com/altador/altadorcup/h5/images/hauntedwoods/player1.png',
    color: '#CDC1FF',
    category: 'nc',
  },
  {
    id: 'nc-events',
    href: '/lists/official?cat=NC%20Event',
    image: 'https://images.neopets.com/neggfest/y28/np/neggs/negg-detective.png',
    color: '#CDC1FF',
    category: 'nc',
  },
  {
    id: 'leaving-nc-mall',
    href: '/mall/leaving',
    image: 'https://images.neopets.com/neopedia/113_leavingshop.gif',
    imageRatio: 350 / 150,
    color: '#CDC1FF',
    category: 'nc',
  },
  {
    id: 'wishlist-importer',
    href: '/lists/import/advanced',
    image: 'https://images.neopets.com/nt/ntimages/107_zafara_dream.gif',
    color: '#CDC1FF',
    category: 'nc',
  },
  {
    id: 'nc-trade-report',
    href: '/mall/report',
    image: 'https://images.neopets.com/images/frontpage/kacheek_day_2006.gif',
    color: '#CDC1FF',
    category: 'nc',
  },
  {
    id: 'item-data-extractor',
    href: '/contribute',
    image: 'https://images.neopets.com/games/betterthanyou/contestant435.gif',
    color: '#4974F5',
    category: 'contribute',
  },
  {
    id: 'missing-info',
    href: '/hub/missing-info',
    image: 'https://images.neopets.com/caption/caption_376.gif',
    color: '#f0fa94',
    category: 'contribute',
  },
  {
    id: 'trade-pricing',
    href: '/feedback/trades',
    image: 'https://images.neopets.com/nt/ntimages/347_trading_post.gif',
    color: '#4A5568',
    category: 'contribute',
  },
  {
    id: 'suggestion-voting',
    href: '/feedback/vote',
    image: 'https://images.neopets.com/altador/altadorcup/link_images/2008/help_me_decide.gif',
    color: '#4974F5',
    category: 'contribute',
  },
];

export function getToolsByCategory(categoryId: ToolCategoryId) {
  return tools.filter((tool) => tool.category === categoryId);
}
