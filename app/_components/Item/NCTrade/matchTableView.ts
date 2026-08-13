import { isSameDay } from 'date-fns';
import { tz } from '@date-fns/tz';
import { cacheLife } from 'next/cache';
import { getFormatter, getTranslations } from 'next-intl/server';
import { getCachedNow } from '@utils/getCachedNow';
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

/** Formats last-seen with a cached wall-clock. `locale` is only a cache key. */
export async function labelMatchTableLastSeen(
  data: MatchTableRow[],
  locale: string
): Promise<MatchTableLabeledRow[]> {
  'use cache';
  cacheLife('itemFast');

  void locale;

  const [t, format, now] = await Promise.all([getTranslations(), getFormatter(), getCachedNow()]);

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
