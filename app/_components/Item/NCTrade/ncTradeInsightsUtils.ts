import type { InsightsResponse, NCMallData, PetStyleAvailabilityData, UserList } from '@types';

export type TradeInsightRelease = NCMallData | UserList | PetStyleAvailabilityData;

/** Begin dates before this day are not reliable (tracking started around then). */
export const STUDIO_AVAILABILITY_BEGIN_CUTOFF = '2026-08-03';

export function isMallRelease(release: TradeInsightRelease): release is NCMallData {
  return 'saleBegin' in release;
}

export function isEventRelease(release: TradeInsightRelease): release is UserList {
  return 'name' in release && 'slug' in release;
}

export function isStudioAvailability(
  release: TradeInsightRelease
): release is PetStyleAvailabilityData {
  return 'style_id' in release && 'availableBegin' in release;
}

export function isBuyable(release: NCMallData, now: number) {
  return release.active && (!release.saleEnd || new Date(release.saleEnd).getTime() > now);
}

export function isEventActive(release: UserList, now: number) {
  const item = release.itemInfo?.[0];
  const seriesStart = item?.seriesStart || release.seriesStart;
  const seriesEnd = item?.seriesEnd || release.seriesEnd;

  return (
    !!seriesStart &&
    new Date(seriesStart).getTime() <= now &&
    (!seriesEnd || new Date(seriesEnd).getTime() > now)
  );
}

export function isStudioActive(avail: PetStyleAvailabilityData, now: number) {
  return !!avail.active && (!avail.availableEnd || new Date(avail.availableEnd).getTime() > now);
}

export function isStudioBeginDisplayable(availableBegin: string | null | undefined) {
  if (!availableBegin) return false;
  return new Date(availableBegin).getTime() >= new Date(STUDIO_AVAILABILITY_BEGIN_CUTOFF).getTime();
}

export function dateMax(...dates: Date[]) {
  return dates.reduce((max, date) => (date > max ? date : max), new Date(0));
}

function getReleaseSortDate(release: TradeInsightRelease) {
  if (isMallRelease(release)) return new Date(release.saleBegin ?? 0);
  if (isEventRelease(release)) return new Date(release.seriesStart ?? 0);
  return new Date(release.availableBegin ?? release.availableEnd ?? 0);
}

function isReleaseActive(release: TradeInsightRelease, now: number) {
  if (isMallRelease(release)) return isBuyable(release, now);
  if (isEventRelease(release)) return isEventActive(release, now);
  return isStudioActive(release, now);
}

export function sortTradeInsightReleases(insights: InsightsResponse, now: number) {
  const arr: TradeInsightRelease[] = [
    ...insights.releases,
    ...insights.ncEvents,
    ...(insights.petStyleAvailability ?? []),
  ];

  return arr.sort((a, b) => {
    const aActive = isReleaseActive(a, now);
    const bActive = isReleaseActive(b, now);

    if (aActive && !bActive) return -1;
    if (bActive && !aActive) return 1;

    return getReleaseSortDate(b).getTime() - getReleaseSortDate(a).getTime();
  });
}
