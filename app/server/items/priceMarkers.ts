import 'server-only';

import Color from 'color';
import { tz } from '@date-fns/tz';
import { isSameDay } from 'date-fns';
import type { OfficialListPriceMarker, PriceMarker, UserList } from '@types';
import { getItemLists } from '@pages/api/v1/items/[id_name]/lists';

type PriceMarkerItemRef = {
  internal_id: number;
  firstSeen: string | null;
};

export type GetItemPriceMarkersOptions = {
  includeTrade?: boolean;
};

/**
 * Fetches official lists for an item and resolves them into presentation-ready
 * {@link PriceMarker}s. Prefer {@link loadItemPriceMarkers} on the item page
 * (shared `'use cache'` with other list loaders); this entry is for HTTP/API use.
 */
export async function getItemPriceMarkers(
  item: PriceMarkerItemRef,
  opts: GetItemPriceMarkersOptions = {}
): Promise<PriceMarker[]> {
  const { official } = await getItemLists(item.internal_id, {
    includeOfficial: true,
    includeTrade: opts.includeTrade ?? false,
  });
  const lists = official.filter((list) => !list.officialTag.includes('Avatar'));
  return resolveOfficialListMarkers(lists, item);
}

/**
 * Maps official list series into {@link PriceMarker}s: validates dates, clamps
 * to `item.firstSeen`, and sets `isPoint` (single-day or open itemAddition).
 */
export function resolveOfficialListMarkers(
  lists: UserList[] | undefined,
  item: Pick<PriceMarkerItemRef, 'firstSeen'>,
  now = new Date()
): OfficialListPriceMarker[] {
  const itemAdded = new Date(item.firstSeen ?? 0);

  return (
    lists
      ?.map((list) => resolveOfficialListMarker(list, itemAdded, now))
      .filter((marker): marker is OfficialListPriceMarker => marker !== null) ?? []
  );
}

function resolveOfficialListMarker(
  list: UserList,
  itemAdded: Date,
  now: Date
): OfficialListPriceMarker | null {
  if (!list.seriesType) return null;

  const itemInfo = list.itemInfo?.[0];
  let startAt = itemInfo?.seriesStart || list.createdAt;

  if (list.seriesType === 'itemAddition' && itemInfo?.addedAt) {
    startAt = itemInfo.seriesStart || itemInfo.addedAt;
  }

  if (list.seriesType === 'listDates') {
    startAt = itemInfo?.seriesStart || list.seriesStart || '';
  }

  if (!startAt) return null;

  const startDate = new Date(startAt);
  const rawEndAt = itemInfo?.seriesEnd || list.seriesEnd;
  const endDate = rawEndAt ? new Date(rawEndAt) : null;

  if (!isValidDate(startDate) || (endDate && !isValidDate(endDate))) return null;
  // A partially future range is hidden as a whole instead of displaying an
  // event or availability period that has not happened yet.
  if (startDate > now || (endDate && endDate > now)) return null;

  const isSingleDay = !!endDate && isSameDay(startDate, endDate, { in: tz('America/Los_Angeles') });

  // Preserve a valid interval for table ordering. Chart uses isPoint for
  // single-day cases as one contextual point instead of a line segment.
  if (endDate && endDate <= startDate && isSingleDay) {
    endDate.setTime(startDate.getTime() + 1);
  }

  if (endDate && endDate > now) return null;

  // Entire window ended before the item existed — skip.
  if (endDate && endDate <= itemAdded) return null;

  const clampedStart = dateMax(itemAdded, startDate);
  const isOpenItemAddition = list.seriesType === 'itemAddition' && !endDate;

  return {
    id: `officialList-${list.internal_id}`,
    type: 'officialList',
    title: list.name,
    description: null,
    slug: list.slug ?? '',
    color: Color(list.colorHex ?? '#000')
      .lightness(70)
      .hex(),
    startAt: clampedStart.toJSON(),
    endAt: endDate?.toJSON() ?? null,
    isPoint: isSingleDay || isOpenItemAddition,
  };
}

function dateMax(...dates: Date[]) {
  return dates.reduce((max, date) => (date > max ? date : max), new Date(0));
}

function isValidDate(date: Date) {
  return !Number.isNaN(date.getTime());
}
