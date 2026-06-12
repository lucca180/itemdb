import Color from 'color';
import { tz } from '@date-fns/tz';
import { format } from 'date-fns';
import { isBusinessDay } from 'lightweight-charts';
import type { Time } from 'lightweight-charts';
import type { PriceData, UserList } from '@types';
import { resolveItemListSeries } from '@utils/itemListSeries';
import { stripMarkdown } from '@utils/utils';

export type ChartPoint = {
  time: string;
  value: number;
  addedAt: string;
  context?: string | null;
};

export type ChartSeriesStyle = {
  id: string;
  name: string;
  lineColor: string;
  topColor: string;
  bottomColor: string;
  startTime: number;
  endTime: number | null;
};

export type ChartSegment = ChartSeriesStyle & {
  data: ChartPoint[];
};

export type ChartSeriesPoint = {
  id: string;
  segmentId: string;
  name: string;
  lineColor: string;
  time: ChartPoint['time'];
  value: ChartPoint['value'];
  addedAt: string;
};

type ListChartSeries = ChartSeriesStyle & {
  startDateKey: ChartPoint['time'];
  endDateKey: ChartPoint['time'] | null;
};

type PendingSeriesPoint = Omit<ChartSeriesPoint, 'segmentId'>;

export function buildPriceChartModel(
  prices: PriceData[],
  lists: UserList[] | undefined,
  defaultSeries: ChartSeriesStyle
) {
  // Convert raw prices and lists into the two concepts rendered by the chart:
  // colored time ranges and contextual points attached to a price.
  const chartData = buildChartData(prices);
  const seriesInfo: ListChartSeries[] = [];
  const pendingPoints: PendingSeriesPoint[] = [];

  resolveItemListSeries(lists).forEach((series) => {
    const isOpenItemAddition = series.type === 'itemAddition' && !series.endAt;

    // A one-day range cannot produce a useful line segment. Open item additions
    // are also events rather than ranges, so both are rendered as context points.
    if (series.isSingleDay || isOpenItemAddition) {
      const chartPoint = getClosestChartPoint(chartData, dateToChartDateKey(series.startAt));
      if (!chartPoint) return;

      pendingPoints.push({
        id: series.id,
        name: series.name,
        lineColor: series.color,
        time: chartPoint.time,
        value: chartPoint.value,
        addedAt: series.startAt,
      });
      return;
    }

    const color = Color(series.color);

    seriesInfo.push({
      id: series.id,
      name: series.name,
      lineColor: series.color,
      topColor: color.alpha(0.62).hexa(),
      bottomColor: color.alpha(0.16).hexa(),
      startTime: new Date(series.startAt).getTime(),
      endTime: series.endAt ? new Date(series.endAt).getTime() : null,
      startDateKey: dateToChartDateKey(series.startAt),
      endDateKey: series.endAt ? dateToChartDateKey(series.endAt) : null,
    });
  });

  // getSeriesAtDate uses the last matching range, so chronological order also
  // defines which list wins when ranges overlap.
  seriesInfo.sort((a, b) => a.startTime - b.startTime);

  const segments = buildChartSegments(chartData, seriesInfo, defaultSeries);
  // Markers must belong to the series that owns their chart date. This lets the
  // rendering layer attach each marker without repeating range-selection logic.
  const seriesPoints = pendingPoints.map((point) => ({
    ...point,
    segmentId: getSeriesAtDate(seriesInfo, point.time)?.id ?? defaultSeries.id,
  }));

  return { segments, seriesPoints };
}

export function timeToChartDateKey(time: Time) {
  if (isBusinessDay(time)) {
    return `${time.year}-${String(time.month).padStart(2, '0')}-${String(time.day).padStart(
      2,
      '0'
    )}`;
  }

  if (typeof time === 'string') return time;
  return null;
}

function buildChartData(prices: PriceData[]) {
  const dataByDay = new Map<ChartPoint['time'], ChartPoint & { addedAtTime: number }>();

  prices.forEach((price) => {
    const time = dateToChartDateKey(price.addedAt);
    const addedAtTime = new Date(price.addedAt).getTime();
    const existingPrice = dataByDay.get(time);

    // Lightweight Charts expects one value per date. Keep the latest price
    // update from each Los Angeles calendar day.
    if (!existingPrice || addedAtTime > existingPrice.addedAtTime) {
      dataByDay.set(time, {
        time,
        value: price.value,
        addedAt: price.addedAt,
        context: price.context ? stripMarkdown(price.context) : null,
        addedAtTime,
      });
    }
  });

  return [...dataByDay.values()]
    .sort((a, b) => a.time.localeCompare(b.time))
    .map(({ time, value, addedAt, context }) => ({ time, value, addedAt, context }));
}

function buildChartSegments(
  data: ChartPoint[],
  seriesInfo: ListChartSeries[],
  defaultSeries: ChartSeriesStyle
) {
  const segments: ChartSegment[] = [];
  let activeSegment: ChartSegment | null = null;

  data.forEach((point) => {
    const segmentInfo = getSeriesAtDate(seriesInfo, point.time) ?? defaultSeries;

    if (!activeSegment || activeSegment.id !== segmentInfo.id) {
      activeSegment = {
        ...segmentInfo,
        // Repeat the previous point so adjacent area series connect visually.
        data: activeSegment?.data.length ? [activeSegment.data[activeSegment.data.length - 1]] : [],
      };
      segments.push(activeSegment);
    }

    activeSegment.data.push(point);
  });

  return segments.filter((segment) => segment.data.length > 1);
}

function getSeriesAtDate(seriesInfo: ListChartSeries[], dateKey: ChartPoint['time']) {
  // Date keys use YYYY-MM-DD, so string comparison is chronological.
  return seriesInfo.findLast((series) => {
    return series.startDateKey <= dateKey && (!series.endDateKey || series.endDateKey >= dateKey);
  });
}

function getClosestChartPoint(chartData: ChartPoint[], dateKey: ChartPoint['time']) {
  if (!chartData.length) return null;
  return chartData.find((point) => point.time >= dateKey) ?? chartData[chartData.length - 1];
}

function dateToChartDateKey(date: string | Date) {
  return format(date, 'yyyy-MM-dd', {
    in: tz('America/Los_Angeles'),
  });
}
