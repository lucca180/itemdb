/**
 * Per-category config for the official list category pages (`/lists/official/<slug>`).
 * See README.md in this folder.
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
    /** Badge on the featured card. Default: `title`. */
    label?: string;
    current: ListMatch;
    /** Section title/description are used as written. Default title: "<title> · past pools". */
    history?: ListMatch & { title?: string; description?: string };
  }[];
};

/** Badge shown on every card of a matching list (featured, pools, chips). */
export type ListLabel = { match: ListMatch; label: string; color?: string };

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
  /**
   * Edition period by year (`YYYY-MM-DD`, UTC). Wins over the lists' `seriesStart/End`.
   * Without `end` the edition shows as "Since <start>".
   */
  editionDates?: Record<number, { start: string; end?: string }>;
  /**
   * Edition year(s) by list slug, for lists whose year can't be derived (no `seriesStart` and no
   * standalone year in the slug). Wins over the derived year; an array shows the list in each year.
   * An `evergreen` list named here shows in both its row and those editions.
   */
  editionYears?: Record<string, number | number[]>;
};

export type GroupsLayout = {
  type: 'groups';
  /**
   * Featured cards right below the hero. Matched lists come first (`label` = their badge);
   * `popular` adds that many of the category's most viewed lists (Umami, last 30 days), which
   * also stay in their groups.
   */
  featured?: ListMatch & { label?: string; popular?: number };
  groups: { id: string; title: string; description?: string; match: ListMatch }[];
};

/**
 * Page blocks below the hero.
 * - `featured`: current track cards / latest edition (overlaps the hero when it comes first)
 * - `intro`: guide bubble with `intro`
 * - `main`: track histories / evergreen + past editions / groups
 * - `other`: lists not matched by any rule
 * - `archive`, `faq`, `related`
 */
export type SectionId = 'featured' | 'intro' | 'main' | 'other' | 'archive' | 'faq' | 'related';

/** A single id renders full width; an array renders those sections side by side. */
export type SectionSlot = SectionId | SectionId[];

export type OfficialCategoryConfig = {
  /** URL segment = route folder name (`official/<slug>/page.tsx`). Wins over an official list slug. */
  slug: string;
  name: string;
  /** `official_tag` values (case-insensitive). Also maps list breadcrumbs to this category. */
  tags: string[];
  /**
   * Extra official lists picked by slug, on top of `tags`, for lists whose tag belongs to
   * something broader (e.g. "Other Events"). Breadcrumbs of these lists still follow their tag.
   */
  lists?: ListMatch;
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
  /**
   * Card badges, set case by case. The list's own `highlight` is NOT used: it is the title of
   * the highlighted items inside the list (e.g. "Premium"), not a label for the whole list.
   */
  labels?: ListLabel[];

  /**
   * Order of the sections below the hero. Sections left out are appended in the default
   * order, so no list ever disappears. Default: `DEFAULT_SECTIONS` in `resolve.ts`.
   */
  sections?: SectionSlot[];

  faq?: { q: string; a: string }[];
  /** WordPress article slugs, in display order. The section is hidden when empty. */
  relatedArticles?: string[];
};
