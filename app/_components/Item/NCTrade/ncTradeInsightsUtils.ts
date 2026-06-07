import type { InsightsResponse, NCMallData, UserList } from '@types';

export function isBuyable(release: NCMallData) {
  return release.active && (!release.saleEnd || new Date(release.saleEnd) > new Date());
}

export function isEventActive(release: UserList) {
  const item = release.itemInfo?.[0];
  const seriesStart = item?.seriesStart || release.seriesStart;
  const seriesEnd = item?.seriesEnd || release.seriesEnd;

  return (
    !!seriesStart &&
    new Date(seriesStart) <= new Date() &&
    (!seriesEnd || new Date(seriesEnd) > new Date())
  );
}

export function dateMax(...dates: Date[]) {
  return dates.reduce((max, date) => (date > max ? date : max), new Date(0));
}

export function sortTradeInsightReleases(insights: InsightsResponse) {
  const arr = [...insights.releases, ...insights.ncEvents];

  return arr.sort((a, b) => {
    const dateA = new Date((a as NCMallData).saleBegin ?? (a as UserList).seriesStart ?? 0);
    const dateB = new Date((b as NCMallData).saleBegin ?? (b as UserList).seriesStart ?? 0);

    if (
      (isEventActive(a as UserList) || isBuyable(a as NCMallData)) &&
      !(isEventActive(b as UserList) || isBuyable(b as NCMallData))
    ) {
      return -1;
    }

    if (
      (isEventActive(b as UserList) || isBuyable(b as NCMallData)) &&
      !(isEventActive(a as UserList) || isBuyable(a as NCMallData))
    ) {
      return 1;
    }

    return dateB.getTime() - dateA.getTime();
  });
}
