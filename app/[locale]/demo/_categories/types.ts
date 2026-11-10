/**
 * DEMO — per-category config for official list category pages.
 * On implementation this folder moves to `app/[locale]/lists/official/_categories/`.
 */

/** Selects lists by slug. Every rule is written by the team, case by case. */
export type ListMatch = {
  slugs?: string[];
  slugPrefix?: string | string[];
};

export type TracksLayout = {
  type: 'tracks';
  /** A track = one recurring prize pool: what is live now plus its own history. */
  tracks: {
    id: string;
    title: string;
    description?: string;
    current: ListMatch;
    history?: ListMatch;
  }[];
};

export type EditionsLayout = {
  type: 'editions';
  /**
   * Lists are grouped by edition year: `seriesStart` year, else a year in the slug.
   * The newest edition is always the hero — even after it ends — so a just-finished
   * event never ends up with an empty "current" area.
   */
  evergreen?: ListMatch & { title?: string };
  /** Pin the order of the lists inside an edition (first match wins). */
  editionOrder?: string[];
};

export type GroupsLayout = {
  type: 'groups';
  groups: { id: string; title: string; description?: string; match: ListMatch }[];
};

export type OfficialCategoryConfig = {
  slug: string;
  name: string;
  /** `official_tag` values (case-insensitive) */
  tags: string[];
  /** Raw `?cat=` values that should 301 to this category */
  legacyTags?: string[];
  color: string;
  image: string;
  seoTitle?: string;
  description: string;

  kicker?: string;
  tagline?: string;
  /** Short paragraphs, English only */
  intro?: string[];

  layout: TracksLayout | EditionsLayout | GroupsLayout;
  /** Forced into the collapsed archive regardless of layout */
  archive?: ListMatch;

  faq?: { q: string; a: string }[];
  /** WordPress article slugs (demo shows the latest 3 posts) */
  relatedArticles?: string[];
};
