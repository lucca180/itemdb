/* eslint-disable react-you-might-not-need-an-effect/you-might-not-need-an-effect */
import { Box } from '@chakra-ui/react';
import Color from 'color';
import { createChart, ColorType, LineStyle } from 'lightweight-charts';
import { useEffect, useRef } from 'react';
import { ColorData, ItemData, PriceData, UserList } from '../../types';
import { VertLine } from './VerticalLine';
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
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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

    chart.timeScale().fitContent();
    chart.priceScale('right').applyOptions({ borderColor: 'white', autoScale: false });
    chart.timeScale().applyOptions({ borderColor: 'white' });

    chart.applyOptions({
      localization: {
        priceFormatter: formatter.number,
      },
    });

    const newSeries = chart.addAreaSeries({
      lineColor,
      topColor: areaTopColor,
      bottomColor: areaBottomColor,
    });

    const dataClone = data.map((p) => {
      return {
        time: format(p.addedAt, 'yyyy-MM-dd', {
          in: tz('America/Los_Angeles'),
        }),
        value: p.value,
      };
    });

    newSeries.setData(dataClone.reverse());

    lists?.map((list) => {
      if (!list.seriesType) return;

      const color = Color(list.colorHex ?? '#000');

      let date = list.createdAt;

      if (list.seriesType === 'itemAddition' && list.itemInfo?.[0].addedAt)
        date = list.itemInfo?.[0].addedAt;

      if (list.seriesType === 'listDates' && list.seriesStart) {
        date = list.itemInfo?.[0].seriesStart || list.seriesStart;

        if (list.seriesEnd) {
          const seriesEnd = new VertLine(
            chart,
            newSeries,
            list.itemInfo?.[0].seriesEnd || list.seriesEnd.toString(),
            {
              showLabel: true,
              labelText: `[End] ${list.name}`,
              color: color.lightness(70).hex(),
              labelTextColor: Color(color.lightness(70).hex()).isDark() ? 'white' : 'black',
              labelBackgroundColor: color.lightness(70).hex(),
            }
          );

          newSeries.attachPrimitive(seriesEnd);
        }
      }

      const vertLine = new VertLine(chart, newSeries, date.toString(), {
        showLabel: true,
        labelText: list.name,
        color: color.lightness(70).hex(),
        labelTextColor: Color(color.lightness(70).hex()).isDark() ? 'white' : 'black',
        labelBackgroundColor: color.lightness(70).hex(),
      });

      newSeries.attachPrimitive(vertLine);
    });

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);

      chart.remove();
    };
  }, [data, color, lists]);

  return <Box flex="1" ref={chartContainerRef} />;
};

export default ChartComponent;
