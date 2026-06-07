import { Badge, Flex, Link, Text } from '@chakra-ui/react';
import { ItemData, UserList } from '@types';
import CardBase from '@components/Card/CardBase';
import NextImage from 'next/image';
import DynamicIcon from '@assets/icons/dynamic.png';
import Color from 'color';
import { getTranslations } from 'next-intl/server';
import { Link as I18nLink } from '@i18n/navigation';
import { getListLink } from '@utils/listLink';
import Markdown from '@components/Utils/Markdown';

type Props = {
  item: ItemData;
  lists: UserList[];
};

export default async function ItemOfficialLists(props: Props) {
  const t = await getTranslations();
  const { item, lists } = props;
  const officialLists = lists.filter((list) => list.official && list.visibility === 'public');
  const color = Color(item.color.hex);

  if (!officialLists.length) return null;

  return (
    <CardBase
      title={
        <Link asChild>
          <I18nLink href="/lists/official">{t('General.official-lists')}</I18nLink>
        </Link>
      }
      color={item.color.hex}
    >
      <Flex
        gap={3}
        flexFlow="row"
        justifyContent="center"
        flexWrap={'wrap'}
        css={{ '& a': { color: color.lightness(70).hex() } }}
      >
        {officialLists.map((list) => (
          <Flex
            key={list.internal_id}
            py={2}
            px={3}
            bg="blackAlpha.500"
            flexFlow={'column'}
            mt="13px"
            w="200px"
            borderRadius={'md'}
            gap={1}
            alignItems={'center'}
          >
            <Flex mt="-20px" justifyContent={'center'}>
              <Link asChild>
                <I18nLink href={getListLink(list)}>
                  <Flex
                    width={'40px'}
                    height={'40px'}
                    bg="white"
                    borderRadius={'md'}
                    overflow={'hidden'}
                  >
                    {list.coverURL && (
                      <NextImage
                        width={40}
                        height={40}
                        quality={90}
                        style={{ objectFit: 'cover' }}
                        src={list.coverURL}
                        alt={list.name}
                      />
                    )}
                  </Flex>
                </I18nLink>
              </Link>
            </Flex>
            <Text textAlign="center" fontSize="sm" fontWeight="bold" css={{ textWrap: 'balance' }}>
              <Link asChild>
                <I18nLink
                  href={getListLink(list)}
                  data-umami-event="item-official-list"
                  data-umami-event-label={list.slug}
                  style={{ color: 'white' }}
                >
                  {list.name}{' '}
                  {list.dynamicType && (
                    <NextImage
                      src={DynamicIcon}
                      alt="dynamic list"
                      width={10}
                      style={{ marginLeft: '2px', display: 'inline-block', verticalAlign: 'sub' }}
                    />
                  )}
                </I18nLink>
              </Link>
            </Text>
            <Text
              textAlign="center"
              fontSize="sm"
              color="whiteAlpha.800"
              css={{ 'b, strong': { color: 'white' }, textWrap: 'pretty' }}
              as="div"
              lineClamp={3}
            >
              <OfficialText list={list} />
            </Text>
            {list.itemInfo?.[0].isHighlight && (
              <Badge>{list.highlight ?? t('ItemPage.exclusive')}</Badge>
            )}
          </Flex>
        ))}
      </Flex>
    </CardBase>
  );
}

async function OfficialText({ list }: { list: UserList }) {
  const t = await getTranslations();
  const isHighlight = list.itemInfo?.[0].isHighlight;

  if (isHighlight && list.highlightText) return <Markdown>{list.highlightText}</Markdown>;

  if (list.description) return <Markdown>{list.description.split(/[\r\n]+/)[0]}</Markdown>;

  return <Markdown>{t('ItemPage.list-no-description')}</Markdown>;
}
