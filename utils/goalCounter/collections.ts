// Official checklists that can have a "collection" goal counter, keyed by the official list slug.
// Progress = items hidden in the user's checklist that are still in the official list.
// `icon` is a remote URL or a path under /public.

type GoalCollection = {
  title: string;
  icon: string;
  /** Shown in the goal counter modal; defaults to the official list name */
  name?: string;
  /** White frame around the icon (default); off for icons with a transparent background */
  iconFrame?: boolean;
  /** Trophy without its white background, for the `classic-trophy` variant (drawn without frame) */
  trophy?: string;
};

const collections = {
  'gourmet-food': {
    title: 'GOURMET FOOD',
    icon: 'https://images.neopets.com/spotlight/hub/icons/gourmet.png',
    // images.neopets.com/games/trophies/trophy_gourmet_1.gif without its white background
    trophy: '/img/goal/trophy-gourmet-food.png',
  },
  neodeck: {
    title: 'NEODECK',
    icon: 'https://images.neopets.com/nt/ntimages/162_wocky_cards.gif',
    // images.neopets.com/trophies/1329_1.gif without its white background
    trophy: '/img/goal/trophy-neodeck.png',
  },
  'book-award': {
    title: 'BOOK AWARD',
    icon: 'https://images.neopets.com/spotlight/hub/icons/bookaward_lg.png',
    // images.neopets.com/games/trophies/trophy_books_read_1.gif without its white background
    trophy: '/img/goal/trophy-book-award.png',
  },
  'booktastic-book-award': {
    title: 'BOOKTASTIC',
    icon: 'https://images.neopets.com/spotlight/hub/icons/booktastic_lg.png',
    // images.neopets.com/games/trophies/trophy_booktastic_books_1.gif without its white background
    trophy: '/img/goal/trophy-booktastic-book-award.png',
  },
  // tagged "Stamps" in the DB, but it is every collectible, not an album page
  'all-collectibles': {
    title: 'STAMP COLLECTOR',
    name: 'Stamp Collector',
    // images.neopets.com/games/pages/trophies/346_1.png without its white background
    icon: '/img/goal/stamp-collector.png',
    iconFrame: false,
  },
} as const satisfies Record<string, GoalCollection>;

export type GoalCollectionSlug = keyof typeof collections;

export const GOAL_COLLECTIONS: Record<GoalCollectionSlug, GoalCollection> = collections;

export const isGoalCollectionSlug = (slug: string | null | undefined): slug is GoalCollectionSlug =>
  !!slug && Object.prototype.hasOwnProperty.call(GOAL_COLLECTIONS, slug);
