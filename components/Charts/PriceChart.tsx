import { Box } from '@chakra-ui/react';
import Color from 'color';
import {
  createChart,
  ColorType,
  LineStyle,
  AreaSeries,
  Time,
  isBusinessDay,
  createSeriesMarkers,
  TrackingModeExitMode,
} from 'lightweight-charts';
import type { MouseEventParams, SeriesMarker } from 'lightweight-charts';
import { useEffect, useRef } from 'react';
import { ColorData, ItemData, PriceData, UserList } from '../../types';
import { useFormatter, useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { tz } from '@date-fns/tz';
import { stripMarkdown } from '@utils/utils';

export type ChartComponentProps = {
  color: ItemData['color'] | ColorData;
  data: PriceData[];
  lists?: UserList[];
};

const ChartComponent = (props: ChartComponentProps) => {
  const formatter = useFormatter();
  const t = useTranslations();
  const { data, color, lists } = props;
  const RBG = Color.rgb(color.rgb).round().array();
  const backgroundColor = 'transparent';
  const lineColor = `rgb(${RBG[0]}, ${RBG[1]}, ${RBG[2]})`;
  const textColor = 'white';
  const areaTopColor = `rgb(${RBG[0]}, ${RBG[1]}, ${RBG[2]})`;
  const areaBottomColor = `rgba(${RBG[0]}, ${RBG[1]}, ${RBG[2]}, 0.28)`;
  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const chartContainer = chartContainerRef.current;
    if (!chartContainer) return;

    const handleResize = () => {
      chart.applyOptions({ width: chartContainer.clientWidth });
    };

    const chart = createChart(chartContainer, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
        attributionLogo: false,
      },
      crosshair: {
        vertLine: {
          //@ts-ignore
          width: 8,
          color: '#C3BCDB44',
          style: LineStyle.Solid,
          labelBackgroundColor: areaTopColor,
        },
        horzLine: {
          color: '#C3BCDB',
          labelBackgroundColor: areaTopColor,
        },
      },
      trackingMode: {
        exitMode: TrackingModeExitMode.OnTouchEnd,
      },
      width: chartContainer.clientWidth,
      height: 200,
    });

    chart.priceScale('right').applyOptions({ borderColor: 'white', autoScale: false });
    chart.timeScale().applyOptions({ borderColor: 'white' });

    chart.applyOptions({
      localization: {
        priceFormatter: formatter.number,
      },
    });

    const chartData = getChartData(data);

    const seriesInfo = getSeriesInfo(lists).sort((a, b) => a.startTime - b.startTime);
    const chartSegments = getChartSegments(chartData, seriesInfo, {
      id: 'default',
      name: 'Price history',
      lineColor,
      topColor: areaTopColor,
      bottomColor: areaBottomColor,
      startTime: Number.NEGATIVE_INFINITY,
      endTime: null,
    });
    const contextByMarkerId = new Map<string, ChartPoint>();
    const seriesByTime = new Map<ChartPoint['time'], ChartSeriesInstance[]>();
    let lastTooltipKey: string | null = null;

    chartSegments.forEach((segment, index) => {
      const isLastSegment = index === chartSegments.length - 1;
      const newSeries = chart.addSeries(AreaSeries, {
        lineColor: segment.lineColor,
        topColor: segment.topColor,
        bottomColor: segment.bottomColor,
        lastValueVisible: isLastSegment,
        priceLineVisible: isLastSegment,
      });

      newSeries.setData(segment.data);
      const seriesInstance = {
        segment,
        series: newSeries,
        dataByTime: new Map(segment.data.map((point) => [point.time, point])),
      };

      segment.data.forEach((point) => {
        if (segment.id === 'default' && !point.context) return;

        const seriesForTime = seriesByTime.get(point.time) ?? [];
        seriesForTime.push(seriesInstance);
        seriesByTime.set(point.time, seriesForTime);
      });

      const contextMarkers = segment.data
        .filter((point) => !!point.context)
        .map((point) => {
          const markerId = `price-context-${segment.id}-${point.time}`;
          contextByMarkerId.set(markerId, point);

          return {
            id: markerId,
            time: point.time,
            position: 'atPriceMiddle',
            price: point.value,
            shape: 'circle',
            color: '#fff',
            size: 0.75,
          } satisfies SeriesMarker<Time>;
        });

      if (contextMarkers.length) {
        createSeriesMarkers(newSeries, contextMarkers, { zOrder: 'top', autoScale: false });
      }
    });

    chart.timeScale().fitContent();

    const tooltip = document.createElement('div');
    tooltip.style.display = 'none';
    tooltip.style.position = 'absolute';
    tooltip.style.zIndex = '2';
    tooltip.style.maxWidth = '240px';
    tooltip.style.padding = '8px 10px';
    tooltip.style.borderRadius = '6px';
    tooltip.style.background = 'rgba(12, 12, 18, 0.92)';
    tooltip.style.boxShadow = '0 8px 18px rgba(0, 0, 0, 0.28)';
    tooltip.style.color = 'white';
    tooltip.style.fontSize = '12px';
    tooltip.style.lineHeight = '1.35';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.transform = 'translate(-50%, calc(-100% - 12px))';
    chartContainer.appendChild(tooltip);

    const hideTooltip = () => {
      tooltip.style.display = 'none';
      lastTooltipKey = null;
    };

    const setSeriesTooltipContent = (series: ChartSeriesTooltipInfo) => {
      const tooltipKey = `series:${series.id}`;
      if (lastTooltipKey === tooltipKey) return;

      const title = document.createElement('div');
      title.textContent = series.name;
      title.style.fontWeight = '700';
      title.style.color = series.lineColor;
      title.style.marginBottom = '4px';

      const type = document.createElement('div');

      const dates = document.createElement('div');
      const startDate = formatter.dateTime(new Date(series.startTime), {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      const endDate = series.endTime
        ? formatter.dateTime(new Date(series.endTime), {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : t('General.now');
      dates.textContent = `${startDate} - ${endDate}`;
      dates.style.opacity = '0.78';

      tooltip.replaceChildren(title, type, dates);
      lastTooltipKey = tooltipKey;
    };

    const setPriceContextTooltipContent = (point: ChartPoint) => {
      const tooltipKey = `context:${point.time}:${point.addedAt}`;
      if (lastTooltipKey === tooltipKey) return;

      const title = document.createElement('div');
      title.textContent = t('ItemPage.price-context');
      title.style.fontWeight = '700';
      title.style.color = lineColor;
      title.style.marginBottom = '4px';

      const price = document.createElement('div');
      price.textContent = `${formatter.number(point.value)} NP`;
      price.style.marginBottom = '4px';

      const date = document.createElement('div');
      date.textContent = formatter.dateTime(new Date(point.addedAt), {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      date.style.opacity = '0.78';
      date.style.marginBottom = '6px';

      const context = document.createElement('div');
      context.textContent = point.context ?? '';
      context.style.whiteSpace = 'pre-wrap';

      tooltip.replaceChildren(title, price, date, context);
      lastTooltipKey = tooltipKey;
    };

    const getClosestSeriesPoint = (
      point: { x: number; y: number },
      time: Time,
      seriesData?: MouseEventParams<Time>['seriesData']
    ) => {
      const timeKey = timeToChartDateKey(time);

      if (!timeKey) return null;

      return (seriesByTime.get(timeKey) ?? []).reduce<ClosestSeriesPoint | null>(
        (closest, chartSeriesItem) => {
          const chartPoint = chartSeriesItem.dataByTime.get(timeKey);
          const crosshairData = seriesData?.get(chartSeriesItem.series);
          const value =
            crosshairData && 'value' in crosshairData ? crosshairData.value : chartPoint?.value;

          if (typeof value !== 'number') return closest;

          const yCoordinate = chartSeriesItem.series.priceToCoordinate(value);

          if (typeof yCoordinate !== 'number') return closest;

          const distance = Math.abs(point.y - yCoordinate);

          if (!closest || distance < closest.distance) {
            return {
              ...chartSeriesItem,
              point: chartPoint,
              value,
              yCoordinate,
              distance,
            };
          }

          return closest;
        },
        null
      );
    };

    const positionTooltip = (point: { x: number; y: number }) => {
      tooltip.style.display = 'block';
      tooltip.style.left = `${point.x}px`;
      tooltip.style.top = `${point.y}px`;

      const tooltipBounds = tooltip.getBoundingClientRect();
      const overflowsLeft = point.x - tooltipBounds.width / 2 < 0;
      const overflowsRight = point.x + tooltipBounds.width / 2 > chartContainer.clientWidth;

      tooltip.style.transform = `translate(${
        overflowsLeft ? '0' : overflowsRight ? '-100%' : '-50%'
      }, calc(-100% - 12px))`;
    };

    const showTooltip = (
      point: { x: number; y: number },
      time: Time,
      options?: {
        markerId?: unknown;
        requireNearLine?: boolean;
        seriesData?: MouseEventParams<Time>['seriesData'];
        closestSeriesPoint?: ClosestSeriesPoint | null;
      }
    ) => {
      if (point.x < 0 || point.y < 0) return (hideTooltip(), false);

      const markerId = options?.markerId;
      const contextPoint =
        typeof markerId === 'string' ? contextByMarkerId.get(markerId) : undefined;

      if (contextPoint) {
        setPriceContextTooltipContent(contextPoint);
        positionTooltip(point);
        return true;
      }

      const closestSeriesPoint =
        options?.closestSeriesPoint ?? getClosestSeriesPoint(point, time, options?.seriesData);

      if (!closestSeriesPoint) {
        hideTooltip();
        return false;
      }

      if (options?.requireNearLine && point.y < closestSeriesPoint.yCoordinate - 4) {
        hideTooltip();
        return false;
      }

      if (closestSeriesPoint.point?.context && closestSeriesPoint.distance <= 12) {
        setPriceContextTooltipContent(closestSeriesPoint.point);
        positionTooltip(point);
        return true;
      }

      if (closestSeriesPoint.segment.id === 'default') {
        hideTooltip();
        return false;
      }

      setSeriesTooltipContent(closestSeriesPoint.segment);
      positionTooltip(point);
      return true;
    };

    chart.subscribeCrosshairMove((param) => {
      if (!param.point || !param.time) {
        hideTooltip();
        return;
      }

      showTooltip(param.point, param.time, {
        markerId: param.hoveredInfo?.objectId,
        requireNearLine: true,
        seriesData: param.seriesData,
      });
    });

    window.addEventListener('resize', handleResize);

    const showTouchTooltip = (event: PointerEvent) => {
      if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;

      const bounds = chartContainer.getBoundingClientRect();
      const point = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      };
      const time = chart.timeScale().coordinateToTime(point.x);

      if (!time) {
        hideTooltip();
        chart.clearCrosshairPosition();
        return;
      }

      const closestSeriesPoint = getClosestSeriesPoint(point, time);

      if (closestSeriesPoint) {
        chart.setCrosshairPosition(
          closestSeriesPoint.value,
          closestSeriesPoint.point?.time ?? time,
          closestSeriesPoint.series
        );
      }

      showTooltip(point, time, { closestSeriesPoint });
    };

    const hideTouchTooltip = (event: PointerEvent) => {
      if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;

      hideTooltip();
      chart.clearCrosshairPosition();
    };

    chartContainer.addEventListener('pointerdown', showTouchTooltip);
    chartContainer.addEventListener('pointermove', showTouchTooltip);
    chartContainer.addEventListener('pointerleave', hideTouchTooltip);
    chartContainer.addEventListener('pointercancel', hideTouchTooltip);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartContainer.removeEventListener('pointerdown', showTouchTooltip);
      chartContainer.removeEventListener('pointermove', showTouchTooltip);
      chartContainer.removeEventListener('pointerleave', hideTouchTooltip);
      chartContainer.removeEventListener('pointercancel', hideTouchTooltip);
      tooltip.remove();

      chart.remove();
    };
  }, [data, color, lists, formatter, t]);

  return <Box flex="1" position="relative" ref={chartContainerRef} />;
};

export default ChartComponent;

type ChartPoint = {
  time: string;
  value: number;
  addedAt: string;
  context?: string | null;
};

const getChartData = (data: PriceData[]) => {
  const dataByDay = new Map<ChartPoint['time'], ChartPoint & { addedAtTime: number }>();

  data.forEach((price) => {
    const time = format(price.addedAt, 'yyyy-MM-dd', {
      in: tz('America/Los_Angeles'),
    });
    const addedAtTime = new Date(price.addedAt).getTime();
    const existingPrice = dataByDay.get(time);

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
    .sort((a, b) => timeToEpoch(a.time) - timeToEpoch(b.time))
    .map(({ time, value, addedAt, context }) => ({ time, value, addedAt, context }));
};

type ChartSegment = {
  id: string;
  name: string;
  lineColor: string;
  topColor: string;
  bottomColor: string;
  startTime: number;
  endTime: number | null;
  data: ChartPoint[];
};

type ChartSeriesInfo = Omit<ChartSegment, 'data'> & {
  seriesType: NonNullable<UserList['seriesType']>;
};

type ChartSeriesTooltipInfo = Omit<ChartSegment, 'data'>;

type ChartSeriesInstance = {
  segment: ChartSegment;
  series: ReturnType<ReturnType<typeof createChart>['addSeries']>;
  dataByTime: Map<ChartPoint['time'], ChartPoint>;
};

type ClosestSeriesPoint = ChartSeriesInstance & {
  point?: ChartPoint;
  value: number;
  yCoordinate: number;
  distance: number;
};

const getSeriesInfo = (lists?: UserList[]): ChartSeriesInfo[] => {
  return (
    lists
      ?.map((list) => {
        if (!list.seriesType) return null;

        const color = Color(list.colorHex ?? '#000').lightness(70);
        const startDate = getListSeriesStart(list);

        if (!startDate) return null;

        const endDate = list.itemInfo?.[0].seriesEnd || list.seriesEnd;

        return {
          id: `${list.internal_id}`,
          name: list.name,
          lineColor: color.hex(),
          topColor: color.alpha(0.62).hexa(),
          bottomColor: color.alpha(0.16).hexa(),
          startTime: new Date(startDate).getTime(),
          endTime: endDate ? new Date(endDate).getTime() : null,
          seriesType: list.seriesType,
        };
      })
      .filter((series): series is ChartSeriesInfo => !!series) ?? []
  );
};

const getListSeriesStart = (list: UserList) => {
  if (list.seriesType === 'itemAddition' && list.itemInfo?.[0].addedAt) {
    return list.itemInfo?.[0].seriesStart || list.itemInfo?.[0].addedAt;
  }

  if (list.seriesType === 'listDates') {
    return list.itemInfo?.[0].seriesStart || list.seriesStart;
  }

  return list.itemInfo?.[0].seriesStart || list.createdAt;
};

const getChartSegments = (
  data: ChartPoint[],
  seriesInfo: ChartSeriesInfo[],
  defaultSeries: Omit<ChartSegment, 'data'>
) => {
  const segments: ChartSegment[] = [];
  let activeSegment: ChartSegment | null = null;

  data.forEach((point) => {
    const segmentInfo = getSeriesAtTime(seriesInfo, timeToEpoch(point.time)) ?? defaultSeries;

    if (!activeSegment || activeSegment.id !== segmentInfo.id) {
      activeSegment = {
        ...segmentInfo,
        data: activeSegment?.data.length ? [activeSegment.data[activeSegment.data.length - 1]] : [],
      };
      segments.push(activeSegment);
    }

    activeSegment.data.push(point);
  });

  return segments.filter((segment) => segment.data.length > 1);
};

const getSeriesAtTime = (seriesInfo: ChartSeriesInfo[], time: number) => {
  return seriesInfo.findLast((series) => {
    return series.startTime <= time && (!series.endTime || series.endTime >= time);
  });
};

const timeToEpoch = (time: Time) => {
  if (isBusinessDay(time)) {
    return new Date(time.year, time.month - 1, time.day).getTime();
  }

  if (typeof time === 'string') {
    return new Date(time).getTime();
  }

  return time * 1000;
};

const timeToChartDateKey = (time: Time) => {
  if (isBusinessDay(time)) {
    return `${time.year}-${String(time.month).padStart(2, '0')}-${String(time.day).padStart(
      2,
      '0'
    )}`;
  }

  if (typeof time === 'string') {
    return time;
  }

  return null;
};
