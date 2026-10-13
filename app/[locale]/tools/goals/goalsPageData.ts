import type { GoalCollectionSlug } from '@utils/goalCounter/collections';

export const GOALS_ACCENT = '#B7791F';
export const GOALS_ACCENT_LIGHT = '#f6d38b';
export const GOALS_ACCENT_RGB = '183, 121, 31';

/** Header image, also used as the page's share image. */
export const GOALS_IMAGE = {
  url: 'https://images.neopets.com/images/frontpage/extremepotato.gif',
  width: 150,
  height: 150,
};

/**
 * Official stamp album lists shown in the gallery (sample images use their real avatar/stamps).
 * The first one is selected by default.
 */
export const SAMPLE_STAMP_ALBUMS = [
  { id: 220, name: 'Faerieland' },
  { id: 137, name: 'Mystery Island' },
  { id: 148, name: 'Haunted Woods' },
  { id: 177, name: 'Lost Desert' },
  { id: 226, name: 'Krawk Island' },
  { id: 223, name: 'Maractite Coins' },
] as const;

export const SAMPLE_COLLECTIONS: readonly GoalCollectionSlug[] = [
  'gourmet-food',
  'neodeck',
  'book-award',
  'booktastic-book-award',
];

export const STAMP_ALBUMS_HREF = '/lists/official/cat/stamps';
export const collectionHref = (slug: GoalCollectionSlug) => `/lists/official/${slug}`;
