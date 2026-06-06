import { DataList, Link, Text } from '@chakra-ui/react';
import CardBase from '@components/Card/CardBase';
import { InfoTip } from '@components/ui/toggle-tip';
import { Link as I18nLink } from '@i18n/navigation';
import { getFormatter, getTranslations } from 'next-intl/server';
import Color from 'color';
import type { ItemData } from '@types';
import { itemToDataList } from '@utils/itemInfo';
import { rarityStr } from '@utils/utils';

type Props = {
  item: ItemData;
};

export default async function ItemInfoCard(props: Props) {
  const t = await getTranslations();
  const format = await getFormatter();
  const { item } = props;
  const dataList = itemToDataList(item, t, format);
  const color = Color(item.color.hex);
  const rgb = item.color.rgb;
  const rarityString = rarityStr(item.rarity ?? 0);

  return (
    <CardBase
      title={t('ItemPage.item-info')}
      color={rgb}
      chakra={{ display: 'flex', gap: 4, flexFlow: 'column' }}
    >
      <DataList.Root orientation="horizontal" size="lg" gap={4}>
        {dataList.map((i) => (
          <DataList.Item key={i.label}>
            <DataList.ItemLabel>
              <Text
                as="span"
                fontWeight="bold"
                display="inline-flex"
                alignItems="center"
                gap={1}
                bg="whiteAlpha.300"
                color="whiteAlpha.800"
                px="2"
                minH={8}
                minW={8}
                rounded="md"
              >
                {i.label}
                {i.helpText && <InfoTip>{i.helpText}</InfoTip>}
              </Text>
            </DataList.ItemLabel>
            <DataList.ItemValue flexDirection="column" textAlign="right">
              {!i.link && <>{i.value}</>}
              {i.link && (
                <Link asChild color={color.lightness(70).hex()} display="inline">
                  <I18nLink href={i.link}>{i.value}</I18nLink>
                </Link>
              )}

              {i.rarityExtra && rarityString && (
                <Text as="span" fontWeight="bold" fontSize="sm" color={rarityString.color}>
                  ({rarityString.text})
                </Text>
              )}
            </DataList.ItemValue>
          </DataList.Item>
        ))}
      </DataList.Root>
    </CardBase>
  );
}
