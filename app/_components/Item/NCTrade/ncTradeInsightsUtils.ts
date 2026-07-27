import type { InsightsResponse, NCMallData, UserList } from '@types';

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

export function dateMax(...dates: Date[]) {
  return dates.reduce((max, date) => (date > max ? date : max), new Date(0));
}

export function sortTradeInsightReleases(insights: InsightsResponse, now: number) {
  const arr = [...insights.releases, ...insights.ncEvents];

  return arr.sort((a, b) => {
    const dateA = new Date((a as NCMallData).saleBegin ?? (a as UserList).seriesStart ?? 0);
    const dateB = new Date((b as NCMallData).saleBegin ?? (b as UserList).seriesStart ?? 0);

    if (
      (isEventActive(a as UserList, now) || isBuyable(a as NCMallData, now)) &&
      !(isEventActive(b as UserList, now) || isBuyable(b as NCMallData, now))
    ) {
      return -1;
    }

    if (
      (isEventActive(b as UserList, now) || isBuyable(b as NCMallData, now)) &&
      !(isEventActive(a as UserList, now) || isBuyable(a as NCMallData, now))
    ) {
      return 1;
    }

    return dateB.getTime() - dateA.getTime();
  });
}
