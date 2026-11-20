import type { UserList } from '@types';
import type { ResolvedCategory } from './resolve';
import type { OfficialCategoryConfig } from './types';

/**
 * Stamp Album: one checklist per album page. On top of the `groups` layout, the page splits the
 * album pages by avatar and sorts them by cost (`groupStampAlbums`), with data from
 * `loadStampAlbums` (loadOfficialLists.ts).
 */
export const stamps = {
  slug: 'stamps',
  name: 'Stamp Album',
  tags: ['stamps'],
  color: '#FFCC00',
  image: 'https://images.neopets.com/caption/caption_421.gif',
  seoTitle: 'Neopets Stamps: Stamp Album Checklists & Prices | itemdb',
  description:
    "Neopets stamp checklists for 50+ Stamp Album pages, including Coins, Charms and Scarabs. Find the stamps you're missing and how much they cost.",
  kicker: "Collector's guide",
  tagline: 'Find the cheapest album page to finish next.',
  intro: [
    'Planning your next avatar? The album pages below are sorted by cost, cheapest first. Import your items to see which stamps you already have.',
  ],
  layout: {
    type: 'groups',
    featured: { slugs: ['all-collectibles'], popular: 2 },
    groups: [],
  },
  faq: [
    {
      q: "How do I see which stamps I'm missing?",
      a: 'Import your items and itemdb will show which stamps on each checklist you already have.',
    },
    {
      q: 'Which stamps are the most expensive?',
      a: 'Open an album page and sort its list by price. Prices come from the market data itemdb collects.',
    },
  ],
} satisfies OfficialCategoryConfig;

/** Per album page (official list id). Lists that aren't album pages (e.g. All Collectibles) have no entry. */
export type StampAlbumInfo = {
  /** NP to buy every stamp at its current price (NC items left out) */
  cost: number;
  /** Active NP stamps without a price */
  unpriced: number;
  /** Album avatar image URL; null while the page is incomplete */
  avatar: string | null;
};

export type StampAlbums = Record<number, StampAlbumInfo>;

export const isStampsCategory = (config: OfficialCategoryConfig) => config.slug === stamps.slug;

/** " Stamp Album - Haunted Woods" -> "Haunted Woods" (names without the prefix stay as they are) */
export const stampAlbumShortName = (name: string) =>
  name
    .trim()
    .replace(/^stamp album\s*[-–:]\s*/i, '')
    .trim();

/**
 * Moves the album pages out of "All lists" into Complete (has an avatar) and Incomplete albums,
 * each cheapest first; albums without a cost go last, by name. Lists that aren't album pages
 * stay where they were. Album pages (groups and popular cards) show without "Stamp Album - ".
 */
export function groupStampAlbums(
  resolved: ResolvedCategory,
  albums: StampAlbums
): ResolvedCategory {
  if (resolved.type !== 'groups') return resolved;

  const cost = (l: UserList) => albums[l.internal_id]?.cost ?? 0;
  const byCost = (a: UserList, b: UserList) =>
    Number(!cost(a)) - Number(!cost(b)) ||
    cost(a) - cost(b) ||
    a.name.trim().localeCompare(b.name.trim());

  const isAlbum = (l: UserList) => !!albums[l.internal_id];
  const short = (l: UserList): UserList =>
    isAlbum(l) ? { ...l, name: stampAlbumShortName(l.name) } : l;
  const pages = resolved.other.filter(isAlbum);

  return {
    ...resolved,
    featured: { ...resolved.featured, popular: resolved.featured.popular.map(short) },
    groups: [
      ...resolved.groups,
      {
        id: 'complete',
        title: 'Complete Albums',
        description: 'Pages with an avatar, cheapest to finish first.',
        lists: pages
          .filter((l) => albums[l.internal_id].avatar)
          .sort(byCost)
          .map(short),
      },
      {
        id: 'incomplete',
        title: 'Incomplete Albums',
        description:
          'Some stamps are not out yet, so there is no avatar until the page is complete.',
        lists: pages
          .filter((l) => !albums[l.internal_id].avatar)
          .sort(byCost)
          .map(short),
      },
    ].filter((g) => g.lists.length),
    other: resolved.other.filter((l) => !isAlbum(l)),
  };
}
