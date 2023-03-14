import { Box } from '@chakra-ui/react';
import Color from 'color';
import { createChart, ColorType, LineStyle } from 'lightweight-charts';
import React, { useEffect, useRef } from 'react';
import { ColorData, ItemData, PriceData } from '../../types';

const intl = new Intl.NumberFormat();

type Props = {
  color: ItemData['color'] | ColorData;
  data: PriceData[];
};

const ChartComponent = (props: Props) => {
  const { data, color } = props;
  const RBG = Color.rgb(color.rgb).round().array();
  const backgroundColor = 'transparent';
  const lineColor = `rgb(${RBG[0]}, ${RBG[1]}, ${RBG[2]})`;
  const textColor = 'white';
  const areaTopColor = `rgb(${RBG[0]}, ${RBG[1]}, ${RBG[2]})`;
  const areaBottomColor = `rgba(${RBG[0]}, ${RBG[1]}, ${RBG[2]}, 0.28)`;
  const chartContainerRef = useRef<any>();

  useEffect(() => {
    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    };

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
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
    chart.priceScale().applyOptions({ borderColor: 'white', autoScale: false });
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
        time: p.addedAt,
        value: p.value,
      };
    });

    newSeries.setData(dataClone.reverse());

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);

      chart.remove();
    };
  }, [data, color]);

  return <Box flex="1" ref={chartContainerRef} />;
};

export default ChartComponent;
