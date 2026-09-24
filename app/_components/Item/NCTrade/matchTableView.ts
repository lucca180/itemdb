import { isSameDay } from 'date-fns';
import { tz } from '@date-fns/tz';
import { getFormatter, getTranslations } from 'next-intl/server';
import { getCachedNow } from '@utils/getCachedNow';
import { resolvePageLocale } from '@utils/locales';
import type { UserList } from '@types';

export type MatchTableRow = {
  internal_id: number;
  name: string;
  slug: string | null;
  ownerUsername: string | null;
  ownerLastSeen: string;
};

export type MatchTableLabeledRow = MatchTableRow & {
  lastSeenLabel: string;
};

export function toMatchTableRows(lists: UserList[]): MatchTableRow[] {
  return lists.map((list) => ({
    internal_id: list.internal_id,
    name: list.name,
    slug: list.slug,
    ownerUsername: list.owner.username,
    ownerLastSeen: list.owner.lastSeen,
  }));
}

export function toMatchCounts(
  matches: { [username: string]: number[] } | null
): { [username: string]: number } | null {
  if (!matches) return null;
  return Object.fromEntries(
    Object.entries(matches)
      .map(([username, ids]) => [username, ids.length] as const)
      .sort(([a], [b]) => a.localeCompare(b))
  );
}

/**
 * Formats last-seen with a cached wall-clock. Invalid locales collapse to the default.
 * Not `'use cache'`: it runs deep in the tree (after user/match lookups), so the prerender
 * warming phase missed it. `getCachedNow()` is already warmed higher up the page.
 */
export async function labelMatchTableLastSeen(
  data: MatchTableRow[],
  rawLocale: string
): Promise<MatchTableLabeledRow[]> {
  const locale = resolvePageLocale(rawLocale);
  const [t, format, now] = await Promise.all([
    getTranslations({ locale }),
    getFormatter({ locale }),
    getCachedNow(),
  ]);

  return [...data]
    .sort((a, b) => {
      const bySeen = new Date(b.ownerLastSeen).getTime() - new Date(a.ownerLastSeen).getTime();
      return bySeen !== 0 ? bySeen : a.internal_id - b.internal_id;
    })
    .map((list) => ({
      ...list,
      lastSeenLabel: isSameDay(new Date(list.ownerLastSeen), now, {
        in: tz('America/Los_Angeles'),
      })
        ? t('General.today')
        : format.relativeTime(new Date(list.ownerLastSeen), now),
    }));
}
