import { Flex } from '@chakra-ui/react';
import Color from 'color';
import CardBase from '@components/Card/CardBase';
import Markdown from '@components/Utils/Markdown';
import { DeferredItemSection } from '@app/_components/Item/page/DeferredItemSection';
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
    <DeferredItemSection>
      <CardBase title={t('ItemPage.notes')} color={item.color.rgb}>
        <Flex
          gap={3}
          flexFlow="column"
          fontSize="sm"
          css={{
            '& a': {
              color: color.lightness(70).hex(),
            },
            '& ul': {
              paddingLeft: '1rem',
              listStyle: 'disc',
            },
          }}
        >
          <Markdown allowedElements={['ul', 'li']}>{item.comment}</Markdown>
        </Flex>
      </CardBase>
    </DeferredItemSection>
  );
}

export default ItemCommentsCard;
