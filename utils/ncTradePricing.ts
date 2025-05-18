import { OwlsTrade } from '@types';
import { differenceInCalendarDays } from 'date-fns';

export function filterMostRecentNc(ncTradeList: OwlsTrade[]) {
  const daysThreshold: { [days: number]: number } = {
    30: 3,
    60: 3,
    120: 3,
    180: 3,
  };

  for (let i = 0; i < Object.keys(daysThreshold).length; i++) {
    const days = parseInt(Object.keys(daysThreshold)[i]);
    const prevDays = parseInt(Object.keys(daysThreshold)[i - 1]) || 0;
    const goal = daysThreshold[days];

    const filtered = ncTradeList.filter(
      (x) =>
        differenceInCalendarDays(Date.now(), new Date(x.ds)) <= days &&
        differenceInCalendarDays(Date.now(), new Date(x.ds)) >= prevDays
    );

    if (checkFiltered(filtered, goal)) return filtered;
  }

  return [];
}

function checkFiltered(filtered: OwlsTrade[], goal: number) {
  if (!filtered.length) return false;

  if (filtered.length >= goal) return true;

  return false;
}
