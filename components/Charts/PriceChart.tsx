import { Box } from '@chakra-ui/react';
import Color from 'color';
import { createChart, ColorType, LineStyle } from 'lightweight-charts';
import React, { useEffect, useRef } from 'react';
import { ColorData, ItemData, PriceData, UserList } from '../../types';
import { VertLine } from './VerticalLine';

const intl = new Intl.NumberFormat();

export type ChartComponentProps = {
  color: ItemData['color'] | ColorData;
  data: PriceData[];
  lists?: UserList[];
  showMarkerLabel?: boolean;
};

const ChartComponent = (props: ChartComponentProps) => {
  const { data, color, lists, showMarkerLabel } = props;
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
        priceFormatter: intl.format,
      },
    });

    const newSeries = chart.addAreaSeries({
      lineColor,
      topColor: areaTopColor,
      bottomColor: areaBottomColor,
    });

    const dataClone = data.map((p) => {
      return {
        time: p.addedAt.split('T')[0],
        value: p.value,
      };
    });

    newSeries.setData(dataClone.reverse());

    lists?.map((list) => {
      if (!list.seriesType) return;

      const date =
        list.seriesType === 'listCreation'
          ? new Date(list.createdAt).toISOString().split('T')[0]
          : new Date(list.itemInfo?.[0].addedAt ?? 0).toISOString().split('T')[0];

      const vertLine = new VertLine(chart, newSeries, date.toString(), {
        showLabel: !!showMarkerLabel,
        labelText: list.name,
        color: list.colorHex ?? '',
        labelTextColor: Color(list.colorHex ?? '').isDark() ? 'white' : 'black',
        labelBackgroundColor: list.colorHex ?? '',
      });

      newSeries.attachPrimitive(vertLine);
    });

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);

      chart.remove();
    };
  }, [data, color, showMarkerLabel, lists]);

  return <Box flex="1" ref={chartContainerRef} />;
};

export default ChartComponent;
