import 'server-only';

import Color from 'color';
import { tz } from '@date-fns/tz';
import { isSameDay } from 'date-fns';
import type { ManualPriceMarker as ManualPriceMarkerRow } from '@prisma/generated/client';
import type { ManualPriceMarkerDTO, OfficialListPriceMarker, PriceMarker, UserList } from '@types';
import { getItemLists } from '@pages/api/v1/items/[id_name]/lists';
import prisma from '@utils/prisma';

type PriceMarkerItemRef = {
  internal_id: number;
  firstSeen: string | null;
};

export type GetItemPriceMarkersOptions = {
  includeTrade?: boolean;
};

/**
 * Fetches official lists + manual markers for an item and resolves them into
 * presentation-ready {@link PriceMarker}s. Prefer {@link loadItemPriceMarkers}
 * on the item page (shared `'use cache'` with other list loaders); this entry
 * is for HTTP/API use.
 */
export async function getItemPriceMarkers(
  item: PriceMarkerItemRef,
  opts: GetItemPriceMarkersOptions = {}
): Promise<PriceMarker[]> {
  const [{ official }, manual] = await Promise.all([
    getItemLists(item.internal_id, {
      includeOfficial: true,
      includeTrade: opts.includeTrade ?? false,
    }),
    getManualPriceMarkers(item),
  ]);
  const lists = official.filter((list) => !list.officialTag.includes('Avatar'));
  return [...resolveOfficialListMarkers(lists, item), ...manual];
}

/** Loads active manual markers for an item and resolves them (dates clamped to firstSeen). */
export async function getManualPriceMarkers(
  item: Pick<PriceMarkerItemRef, 'internal_id' | 'firstSeen'>,
  now = new Date()
): Promise<ManualPriceMarkerDTO[]> {
  const rows = await prisma.manualPriceMarkerItem.findMany({
    where: { item_iid: item.internal_id },
    select: { marker: true },
  });

  return resolveManualMarkers(
    rows.map((row) => row.marker),
    item,
    now
  );
}

/**
 * Maps manual marker rows into {@link PriceMarker}s: validates dates, clamps to
 * `item.firstSeen`, and hides fully-future markers (same rules as official lists).
 * Admin-provided `isPoint`/`color`/`badgeText`/`title`/`description` pass through as-is.
 */
export function resolveManualMarkers(
  markers: ManualPriceMarkerRow[] | undefined,
  item: Pick<PriceMarkerItemRef, 'firstSeen'>,
  now = new Date()
): ManualPriceMarkerDTO[] {
  const itemAdded = new Date(item.firstSeen ?? 0);

  return (
    markers
      ?.map((marker) => resolveManualMarker(marker, itemAdded, now))
      .filter((marker): marker is ManualPriceMarkerDTO => marker !== null) ?? []
  );
}

function resolveManualMarker(
  marker: ManualPriceMarkerRow,
  itemAdded: Date,
  now: Date
): ManualPriceMarkerDTO | null {
  const startDate = new Date(marker.startAt);
  let endDate = marker.endAt ? new Date(marker.endAt) : null;

  if (!isValidDate(startDate) || (endDate && !isValidDate(endDate))) return null;

  // Mirror write-path / official-list same-day behavior.
  const isSameDayRange =
    !!endDate && isSameDay(startDate, endDate, { in: tz('America/Los_Angeles') });
  const isPoint = marker.isPoint || isSameDayRange;
  if (isPoint) endDate = null;

  // Hide the whole marker while any part of it is still in the future.
  if (startDate > now || (endDate && endDate > now)) return null;
  // Window ended before the item existed — skip.
  if (endDate && endDate <= itemAdded) return null;

  const clampedStart = dateMax(itemAdded, startDate);

  // Drop empty shells — badge/title/description cannot all be null.
  if (marker.title == null && marker.description == null && marker.badgeText == null) {
    return null;
  }

  return {
    id: `manual-${marker.internal_id}`,
    type: 'manual',
    title: marker.title,
    badgeText: marker.badgeText,
    description: marker.description,
    color: marker.color,
    startAt: clampedStart.toJSON(),
    endAt: endDate?.toJSON() ?? null,
    isPoint,
  };
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
