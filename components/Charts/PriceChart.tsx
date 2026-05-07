import { Box } from '@chakra-ui/react';
import Color from 'color';
import {
  createChart,
  ColorType,
  LineStyle,
  AreaSeries,
  Time,
  isBusinessDay,
} from 'lightweight-charts';
import { useEffect, useRef } from 'react';
import { ColorData, ItemData, PriceData, UserList } from '../../types';
import { useFormatter } from 'next-intl';
import { format } from 'date-fns';
import { tz } from '@date-fns/tz';

export type ChartComponentProps = {
  color: ItemData['color'] | ColorData;
  data: PriceData[];
  lists?: UserList[];
};

const ChartComponent = (props: ChartComponentProps) => {
  const formatter = useFormatter();
  const { data, color, lists } = props;
  const RBG = Color.rgb(color.rgb).round().array();
  const backgroundColor = 'transparent';
  const lineColor = `rgb(${RBG[0]}, ${RBG[1]}, ${RBG[2]})`;
  const textColor = 'white';
  const areaTopColor = `rgb(${RBG[0]}, ${RBG[1]}, ${RBG[2]})`;
  const areaBottomColor = `rgba(${RBG[0]}, ${RBG[1]}, ${RBG[2]}, 0.28)`;
  const chartContainerRef = useRef<any>(undefined);

  useEffect(() => {
    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    };

    const chart = createChart(chartContainerRef.current, {
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
      width: chartContainerRef.current.clientWidth,
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
    const visibleSeriesBySegment = new Map<string, ReturnType<typeof chart.addSeries>>();

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
      visibleSeriesBySegment.set(segment.id, newSeries);
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
    chartContainerRef.current.appendChild(tooltip);

    const setTooltipContent = (series: ChartSeriesInfo) => {
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
        : 'Now';
      dates.textContent = `${startDate} - ${endDate}`;
      dates.style.opacity = '0.78';

      tooltip.replaceChildren(title, type, dates);
    };

    chart.subscribeCrosshairMove((param) => {
      if (!param.point || param.point.x < 0 || param.point.y < 0 || !param.time) {
        tooltip.style.display = 'none';
        return;
      }

      const hoveredSeries = getSeriesAtTime(seriesInfo, timeToEpoch(param.time));

      if (!hoveredSeries) {
        tooltip.style.display = 'none';
        return;
      }

      const areaSeries = visibleSeriesBySegment.get(hoveredSeries.id);
      const seriesData = areaSeries ? param.seriesData.get(areaSeries) : null;
      const value = seriesData && 'value' in seriesData ? seriesData.value : null;
      const yCoordinate = typeof value === 'number' ? areaSeries?.priceToCoordinate(value) : null;

      if (typeof yCoordinate === 'number' && param.point.y < yCoordinate - 4) {
        tooltip.style.display = 'none';
        return;
      }

      setTooltipContent(hoveredSeries);
      tooltip.style.display = 'block';
      tooltip.style.left = `${param.point.x}px`;
      tooltip.style.top = `${param.point.y}px`;
    });

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      tooltip.remove();

      chart.remove();
    };
  }, [data, color, lists, formatter]);

  return <Box flex="1" position="relative" ref={chartContainerRef} />;
};

export default ChartComponent;

type ChartPoint = {
  time: string;
  value: number;
};

const getChartData = (data: PriceData[]) => {
  const dataByDay = new Map<string, ChartPoint & { addedAtTime: number }>();

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
        addedAtTime,
      });
    }
  });

  return [...dataByDay.values()]
    .sort((a, b) => timeToEpoch(a.time) - timeToEpoch(b.time))
    .map(({ time, value }) => ({ time, value }));
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
