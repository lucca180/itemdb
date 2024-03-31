// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck
import CalHeatmap from 'cal-heatmap';
import Tooltip from 'cal-heatmap/plugins/Tooltip';
import LegendLite from 'cal-heatmap/plugins/LegendLite';
import CalendarLabel from 'cal-heatmap/plugins/CalendarLabel';
import 'cal-heatmap/cal-heatmap.css';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useFormatter, useTranslations } from 'next-intl';
import { Center, Flex, Select, Text } from '@chakra-ui/react';
import { RestockChart } from '../../types';

const format = Intl.NumberFormat().format;

type CalendarHeatmapProps = {
  chartData: RestockChart;
  onClick?: (timestamp: number) => void;
};

type ChartTypes = keyof RestockChart;

export default function CalendarHeatmap(props: CalendarHeatmapProps) {
  const { chartData, onClick } = props;
  const t = useTranslations();
  const formater = useFormatter();
  const calRef = useRef(new CalHeatmap());
  const router = useRouter();
  const isMounted = useRef(false);
  const [chartType, setChartType] = useState<ChartTypes>('revenuePerDay');

  useEffect(() => {
    const cal = calRef.current;
    cal.on('click', (event, timestamp, value) => {
      if (!value) return;
      onClick?.(timestamp);
    });
  }, []);

  useEffect(() => {
    const cal = calRef.current;
    const data = chartData[chartType];
    const startOfTheYear = new Date(new Date().getFullYear(), 0, 1);
    let scaleDomain = [25000, 100000, 500000];

    if (chartType === 'refreshesPerDay') {
      scaleDomain = [50, 100, 500, 1000];
    }

    if (chartType === 'lossesPerDay') {
      scaleDomain = [500000, 1000000, 5000000];
    }

    cal
      .paint(
        {
          theme: 'dark',
          data: { source: data, x: 'date', y: 'value', groupY: 'sum' },
          date: { start: startOfTheYear, locale: router.locale },
          range: 12,
          scale: {
            color: {
              type: 'threshold',
              interpolate: 'hcl',
              range: ['#14432a', '#166b34', '#37a446', '#4dd05a'],
              domain: scaleDomain,
            },
          },

          domain: {
            type: 'month',

            gutter: 4,
            label: { text: 'MMM', textAlign: 'start', position: 'top' },
          },
          subDomain: { type: 'ghDay', radius: 2, width: 11, height: 11, gutter: 4 },
          itemSelector: '#cal-heatmap',
        },
        [
          [
            LegendLite,
            {
              includeBlank: true,
              itemSelector: '#ex-ghDay-legend',
              radius: 2,
              width: 11,
              height: 11,
              gutter: 4,
            },
          ],
          [
            CalendarLabel,
            {
              width: 30,
              textAlign: 'start',
              text: () => daysForLocale().map((d, i) => (i % 2 == 0 ? '' : d)),
              padding: [25, 0, 0, 0],
            },
          ],
          [
            Tooltip,
            {
              text: (date, value) => tooltipText(date, value, chartType, formater),
            },
          ],
        ]
      )
      .then(() => (isMounted.current = true));
  }, [chartData, chartType]);

  // useEffect(() => {
  //   console.log(isMounted.current);
  //   if (!isMounted.current) return;
  //   const cal = calRef.current;

  //   cal.fill(chartData[chartType]);
  // }, [chartData, chartType]);

  return (
    <Center flexFlow="column" gap={3} mt={8} overflow="auto">
      <Select
        maxW="250px"
        variant={'filled'}
        onChange={(e) => setChartType(e.target.value as ChartTypes)}
      >
        <option value="revenuePerDay">{t('Restock.revenue-per-day')}</option>
        <option value="lossesPerDay">{t('Restock.losses-per-day')}</option>
        <option value="refreshesPerDay">{t('Restock.refreshes-per-day')}</option>
      </Select>
      <Text fontSize="xs" color="whiteAlpha.800">
        {t('Restock.chart-tip')}
      </Text>
      <Flex
        alignSelf={{ base: 'flex-start', lg: 'center' }}
        sx={{ '.ch-subdomain-bg': { cursor: 'pointer' } }}
      >
        <div id="cal-heatmap"></div>
      </Flex>
      <div style={{ fontSize: 12 }}>
        <span style={{ color: '#768390' }}>{t('General.less')}</span>
        <div id="ex-ghDay-legend" style={{ display: 'inline-block', margin: '0 4px' }}></div>
        <span style={{ color: '#768390', fontSize: 12 }}>{t('General.more')}</span>
      </div>
    </Center>
  );
}

function daysForLocale() {
  const { format } = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
  return [...Array(7).keys()].map((day) => format(new Date(Date.UTC(2021, 5, day))));
}

function tooltipText(
  date: Date,
  value: number | null,
  chartType: ChartTypes,
  formater: ReturnType<typeof useFormatter>
) {
  const valueSrt = format(value ?? 0);
  const dateStr = formater.dateTime(date, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (chartType == 'refreshesPerDay') {
    return `${valueSrt}x - ${dateStr}`;
  }

  return `${valueSrt} NP - ${dateStr}`;
}
