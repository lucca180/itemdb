import Color from 'color';
import { tz } from '@date-fns/tz';
import { isSameDay } from 'date-fns';
import type { UserList } from '@types';

export type ItemListSeries = {
  id: string;
  name: string;
  slug: string;
  type: NonNullable<UserList['seriesType']>;
  color: string;
  startAt: string;
  endAt: string | null;
  isSingleDay: boolean;
};

export function resolveItemListSeries(
  lists: UserList[] | undefined,
  now = new Date()
): ItemListSeries[] {
  return lists?.map((list) => resolveSeries(list, now)).filter(isItemListSeries) ?? [];
}

function resolveSeries(list: UserList, now: Date): ItemListSeries | null {
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

  // Preserve a valid interval for table ordering. The chart uses isSingleDay
  // to render this case as one contextual point instead of a line segment.
  if (endDate && endDate <= startDate && isSingleDay) {
    endDate.setTime(startDate.getTime() + 1);
  }

  if (endDate && endDate > now) return null;

  return {
    id: `${list.internal_id}`,
    name: list.name,
    slug: list.slug ?? '',
    type: list.seriesType,
    color: Color(list.colorHex ?? '#000')
      .lightness(70)
      .hex(),
    startAt: startDate.toJSON(),
    endAt: endDate?.toJSON() ?? null,
    isSingleDay,
  };
}

function isValidDate(date: Date) {
  return !Number.isNaN(date.getTime());
}

function isItemListSeries(series: ItemListSeries | null): series is ItemListSeries {
  return series !== null;
}
