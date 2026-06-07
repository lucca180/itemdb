import { Flex } from '@chakra-ui/react';
import Color from 'color';
import CardBase from '@components/Card/CardBase';
import Markdown from '@components/Utils/Markdown';
import { getTranslations } from 'next-intl/server';
import type { ItemData } from '@types';

type Props = {
  item: ItemData;
};

export async function ItemCommentsCard({ item }: Props) {
  if (!item.comment) return null;

  const t = await getTranslations();
  const color = Color(item.color.hex);

  return (
    <CardBase title={t('ItemPage.notes')} color={item.color.rgb}>
      <Flex
        gap={3}
        flexFlow="column"
        fontSize="sm"
        textAlign="center"
        css={{
          '& a': {
            color: color.lightness(70).hex(),
          },
          '& ul': {
            padding: 'revert',
          },
        }}
      >
        <Markdown>{item.comment}</Markdown>
      </Flex>
    </CardBase>
  );
}

export default ItemCommentsCard;
