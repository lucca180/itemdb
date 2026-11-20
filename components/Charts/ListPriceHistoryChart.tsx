import { Box } from '@chakra-ui/react';
import { ColorInstance } from 'color';
import { createChart, ColorType, LineStyle, AreaSeries } from 'lightweight-charts';
import { useFormatter } from 'next-intl';
import React, { useEffect, useRef } from 'react';
import type { ListPriceHistoryPoint } from '@utils/list/listPriceHistory';

export type ListChartComponentProps = {
  color: ColorInstance;
  /** Sorted by date, one point per day at most */
  priceData: ListPriceHistoryPoint[];
};

const ListChartComponent = (props: ListChartComponentProps) => {
  const formatter = useFormatter();
  const { priceData, color } = props;
  const RBG = color.lightness(50).rgb().round().array();
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
      height: 300,
    });

    chart.timeScale().fitContent();
    chart.priceScale('right').applyOptions({ borderColor: 'white', autoScale: true });
    chart.timeScale().applyOptions({ borderColor: 'white' });
    // chart.priceScale('left').applyOptions({ borderColor: 'white', autoScale: false, visible: true });

    chart.applyOptions({
      localization: {
        priceFormatter: formatter.number,
      },
    });

    // ------- prices ------- //
    const newSeries = chart.addSeries(AreaSeries, {
      lineColor,
      topColor: areaTopColor,
      bottomColor: areaBottomColor,
      priceScaleId: 'right',
    });

    newSeries.setData(priceData.map((p) => ({ time: p.date, value: p.value })));

    // ------- no data ------- //

    // const lineSeries = chart.addSeries(LineSeries, { color: '#2962FF', priceScaleId: 'left' });
    // lineSeries.setData(priceData.map((p) => ({ time: p.date, value: p.pricedItems })));

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);

      chart.remove();
    };
  }, [priceData, color]);

  return <Box flex="1" ref={chartContainerRef} />;
};

export default ListChartComponent;
