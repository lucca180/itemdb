// Official checklists that can have a "collection" goal counter, keyed by the official list slug.
// Progress = items hidden in the user's checklist that are still in the official list.

export const GOAL_COLLECTIONS = {
  'gourmet-food': {
    title: 'GOURMET FOOD',
    icon: 'https://images.neopets.com/spotlight/hub/icons/gourmet.png',
  },
  neodeck: {
    title: 'NEODECK',
    icon: 'https://images.neopets.com/nt/ntimages/162_wocky_cards.gif',
  },
  'book-award': {
    title: 'BOOK AWARD',
    icon: 'https://images.neopets.com/spotlight/hub/icons/bookaward_lg.png',
  },
  'booktastic-book-award': {
    title: 'BOOKTASTIC',
    icon: 'https://images.neopets.com/spotlight/hub/icons/booktastic_lg.png',
  },
} as const;

export type GoalCollectionSlug = keyof typeof GOAL_COLLECTIONS;

export const isGoalCollectionSlug = (slug: string | null | undefined): slug is GoalCollectionSlug =>
  !!slug && Object.prototype.hasOwnProperty.call(GOAL_COLLECTIONS, slug);
