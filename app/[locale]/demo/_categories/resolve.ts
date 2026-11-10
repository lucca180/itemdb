import type { UserList } from '@types';
import type { ListMatch, OfficialCategoryConfig } from './types';

export type EditionGroup = { year: number; lists: UserList[] };

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

export function resolveCategory(config: OfficialCategoryConfig, all: UserList[]): ResolvedCategory {
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

    const editions = [...byYear.entries()]
      .sort(([a], [b]) => b - a)
      .map(([year, ls]) => ({
        year,
        lists: ls.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name)),
      }));

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

  const groups = layout.groups.map((g) => ({
    id: g.id,
    title: g.title,
    description: g.description,
    lists: take(lists.filter((l) => matches(l, g.match))),
  }));
  return { type: 'groups', groups, other: rest(), archive };
}
