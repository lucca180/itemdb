import type { ReactNode } from 'react';
import { IconLink } from '@components/Utils/IconLink';
import { getFormatter, getTranslations } from 'next-intl/server';
import type { ItemData, NCMallData } from '@types';

export type LeavingMallDateGroup = {
  date: string;
  mallData: NCMallData[];
};

export type LeavingMallPageLabels = {
  title: string;
  description: ReactNode;
  metaDescription: string;
  itemsByDate: LeavingMallDateGroup[];
  itemData: ItemData[];
};

export async function buildLeavingMallPageProps(
  mallData: NCMallData[],
  itemData: ItemData[]
): Promise<LeavingMallPageLabels> {
  const t = await getTranslations();
  const formatter = await getFormatter();

  const dates: Record<string, NCMallData[]> = {};
  mallData.forEach((data) => {
    if (!data.saleEnd) return;
    const dateFormatted = formatter.dateTime(new Date(data.saleEnd), {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    if (!dates[dateFormatted]) dates[dateFormatted] = [];
    dates[dateFormatted].push(data);
  });

  return {
    title: t('NcMall.leaving-soon-tm'),
    description: t.rich('NcMall.leaving-soon-desc', {
      Link: (chunk) => (
        <IconLink href="https://ncmall.neopets.com/" isExternal>
          {chunk}
        </IconLink>
      ),
    }),
    metaDescription:
      t
        .rich('NcMall.leaving-soon-desc', {
          Link: (chunk) => chunk,
        })
        ?.toString() ?? '',
    itemsByDate: Object.entries(dates).map(([date, items]) => ({ date, mallData: items })),
    itemData,
  };
}
