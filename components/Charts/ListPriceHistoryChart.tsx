import { Box } from '@chakra-ui/react';
import Color from 'color';
import { createChart, ColorType, LineStyle } from 'lightweight-charts';
import React, { useEffect, useRef } from 'react';

const intl = new Intl.NumberFormat();

export type ListChartComponentProps = {
  color: Color<string>;
  priceData: { [day: string]: number };
  noDataData: { [day: string]: number[] };
};

const ListChartComponent = (props: ListChartComponentProps) => {
  const { priceData, color } = props;
  const RBG = color.lightness(50).rgb().round().array();
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
      height: 300,
    });

    chart.timeScale().fitContent();
    chart.priceScale('right').applyOptions({ borderColor: 'white', autoScale: true });
    chart.timeScale().applyOptions({ borderColor: 'white' });
    // chart.priceScale('left').applyOptions({ borderColor: 'white', autoScale: false, visible: true });

    chart.applyOptions({
      localization: {
        priceFormatter: intl.format,
      },
    });

    // ------- prices ------- //
    const newSeries = chart.addAreaSeries({
      lineColor,
      topColor: areaTopColor,
      bottomColor: areaBottomColor,
      priceScaleId: 'right',
    });

    const dataClone = Object.entries(priceData).map((p) => {
      return {
        time: p[0],
        value: p[1],
      };
    });

    dataClone.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    newSeries.setData(dataClone);

    // ------- no data ------- //

    // const lineSeries = chart.addLineSeries({ color: '#2962FF', priceScaleId: 'left' });

    // const noDataData = Object.entries(props.noDataData).map((p) => {
    //   return {
    //     time: p[0],
    //     value: p[1].length,
    //   };
    // });

    // noDataData.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    // lineSeries.setData(noDataData);

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);

      chart.remove();
    };
  }, [priceData, color]);

  return <Box flex="1" ref={chartContainerRef} />;
};

export default ListChartComponent;
