import type { UserList } from '@types';
import type { ListMatch, OfficialCategoryConfig, SectionId, SectionSlot } from './types';

export const DEFAULT_SECTIONS: SectionSlot[] = [
  'featured',
  'intro',
  'main',
  'other',
  'archive',
  ['faq', 'related'],
];

/** Config order (duplicates dropped) + any missing section, in default order. */
export function resolveSections(config: OfficialCategoryConfig): SectionSlot[] {
  const seen = new Set<SectionId>();
  const keep = (slot: SectionSlot): SectionSlot | null => {
    const ids = [slot].flat().filter((id) => !seen.has(id));
    ids.forEach((id) => seen.add(id));
    if (!ids.length) return null;
    return Array.isArray(slot) ? ids : ids[0];
  };
  const order = (config.sections ?? DEFAULT_SECTIONS).map(keep);
  const missing = DEFAULT_SECTIONS.flat()
    .filter((id) => !seen.has(id))
    .map(keep);
  return [...order, ...missing].filter((s): s is SectionSlot => s !== null);
}

export type EditionGroup = {
  year: number;
  lists: UserList[];
  /** Config `editionDates[year]`, else the first list with series dates. */
  start: string | null;
  end: string | null;
  datesFromConfig: boolean;
};

export type ResolvedCategory = {
  other: UserList[];
  archive: UserList[];
} & (
  | {
      type: 'tracks';
      tracks: {
        id: string;
        title: string;
        description?: string;
        label: string;
        historyTitle: string;
        historyDescription?: string;
        current: UserList[];
        history: UserList[];
      }[];
    }
  | {
      type: 'editions';
      latest: EditionGroup | null;
      evergreen: { title: string; lists: UserList[] } | null;
      past: EditionGroup[];
    }
  | {
      type: 'groups';
      featured: { label?: string; lists: UserList[]; popular: UserList[] };
      groups: { id: string; title: string; description?: string; lists: UserList[] }[];
    }
);

const slugOf = (l: UserList) => (l.slug ?? '').toLowerCase();

export const matches = (list: UserList, m?: ListMatch) => {
  if (!m) return false;
  const slug = slugOf(list);
  if (m.slugs?.some((s) => s.toLowerCase() === slug)) return true;
  const prefixes = m.slugPrefix ? [m.slugPrefix].flat() : [];
  return prefixes.some((p) => slug.startsWith(p.toLowerCase()));
};

/** Config badges that apply to a list, in config order. */
export const listLabels = (config: OfficialCategoryConfig, list: UserList) =>
  (config.labels ?? []).filter((l) => matches(list, l.match));

const time = (d?: string | null) => (d ? new Date(d).getTime() : 0);

/** Newest first: seriesStart, then createdAt. */
const byNewest = (a: UserList, b: UserList) =>
  time(b.seriesStart ?? b.createdAt) - time(a.seriesStart ?? a.createdAt);

/** Edition year = seriesStart year, else a standalone year in the slug. */
export const editionYear = (list: UserList): number | null => {
  if (list.seriesStart) return new Date(list.seriesStart).getUTCFullYear();
  const m = slugOf(list).match(/(?:^|-)((?:19|20)\d{2})(?:-|$)/);
  return m ? Number(m[1]) : null;
};

/** Does this config need list pageviews (see `featured.popular`)? */
export const needsPageviews = (config: OfficialCategoryConfig) =>
  config.layout.type === 'groups' && !!config.layout.featured?.popular;

/** @param pageviews list slug (lowercase) → recent pageviews, for `featured.popular`. */
export function resolveCategory(
  config: OfficialCategoryConfig,
  all: UserList[],
  pageviews: Record<string, number> = {}
): ResolvedCategory {
  const archive = all.filter((l) => matches(l, config.archive)).sort(byNewest);
  const lists = all.filter((l) => !archive.includes(l));
  const used = new Set<number>();
  const take = (arr: UserList[]) => {
    arr.forEach((l) => used.add(l.internal_id));
    return arr;
  };
  const rest = () => lists.filter((l) => !used.has(l.internal_id));
  const layout = config.layout;

  if (layout.type === 'tracks') {
    const tracks = layout.tracks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      label: t.label ?? t.title,
      historyTitle: t.history?.title ?? `${t.title} · past pools`,
      historyDescription: t.history?.description,
      current: take(lists.filter((l) => matches(l, t.current))),
      history: take(lists.filter((l) => matches(l, t.history)).sort(byNewest)),
    }));
    return { type: 'tracks', tracks, other: rest().sort(byNewest), archive };
  }

  if (layout.type === 'editions') {
    const evergreenLists = take(lists.filter((l) => matches(l, layout.evergreen)));
    const order = layout.editionOrder ?? [];
    const rank = (l: UserList) => {
      const i = order.findIndex((p) => slugOf(l).startsWith(p.toLowerCase()));
      return i === -1 ? order.length : i;
    };

    const byYear = new Map<number, UserList[]>();
    rest().forEach((l) => {
      const year = editionYear(l);
      if (year === null) return;
      used.add(l.internal_id);
      byYear.set(year, [...(byYear.get(year) ?? []), l]);
    });

    const editions: EditionGroup[] = [...byYear.entries()]
      .sort(([a], [b]) => b - a)
      .map(([year, ls]) => {
        const sorted = ls.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
        const configured = layout.editionDates?.[year];
        const dated =
          sorted.find((l) => l.seriesStart && l.seriesEnd) ?? sorted.find((l) => l.seriesStart);
        return {
          year,
          lists: sorted,
          start: configured?.start ?? dated?.seriesStart ?? null,
          end: configured ? (configured.end ?? null) : (dated?.seriesEnd ?? null),
          datesFromConfig: !!configured,
        };
      });

    return {
      type: 'editions',
      latest: editions[0] ?? null,
      evergreen: evergreenLists.length
        ? { title: layout.evergreen?.title ?? 'Every edition', lists: evergreenLists }
        : null,
      past: editions.slice(1),
      other: rest().sort(byNewest),
      archive,
    };
  }

  const pinned = take(lists.filter((l) => matches(l, layout.featured)));
  const views = (l: UserList) => pageviews[slugOf(l)] ?? 0;
  // Not taken: popular lists stay in their groups too.
  const popular = lists
    .filter((l) => !used.has(l.internal_id) && views(l) > 0)
    .sort((a, b) => views(b) - views(a))
    .slice(0, layout.featured?.popular ?? 0);
  const featured = { label: layout.featured?.label, lists: pinned, popular };
  const groups = layout.groups.map((g) => ({
    id: g.id,
    title: g.title,
    description: g.description,
    lists: take(lists.filter((l) => matches(l, g.match))),
  }));
  return { type: 'groups', featured, groups, other: rest(), archive };
}
