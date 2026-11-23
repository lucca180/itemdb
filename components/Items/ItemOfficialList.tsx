import { Badge, Flex, Link, Text } from '@chakra-ui/react';
import { ItemData, ListContext, UserList } from '@types';
import { ListContextFooter } from '@components/UserLists/Contexts/ListContextBadges';
import CardBase from '@components/Card/CardBase';
import NextImage from 'next/image';
import DynamicIcon from '@assets/icons/dynamic.png';
import Color from 'color';
import { getTranslations } from 'next-intl/server';
import { Link as I18nLink } from '@i18n/navigation';
import { getListLink } from '@utils/list/listLink';
import Markdown from '@components/Utils/Markdown';
import ItemOfficialListCTA from '@components/Items/ItemOfficialListCTA';
import Tooltip from '@components/Utils/Tooltip';
import MainLink from '@components/Utils/MainLink';

type Props = {
  item: ItemData;
  lists: UserList[];
  /** Contexts that include this item, per list id */
  contexts?: Record<number, ListContext[]>;
};

export default async function ItemOfficialLists(props: Props) {
  const t = await getTranslations();
  const { item, lists, contexts } = props;
  const officialLists = lists.filter((list) => list.official && list.visibility === 'public');
  const color = Color(item.color.hex);
  const excludeListIds = lists.map((list) => list.internal_id);

  const title = (
    <Link asChild>
      <I18nLink href="/lists/official">{t('General.official-lists')}</I18nLink>
    </Link>
  );

  const linkColor = color.lightness(70).hex();

  // 1-based place in the ranked order (rankItemOfficialLists), out of `total`
  const trackPosition = (index: number) => ({ position: index + 1, total: officialLists.length });

  if (!officialLists.length) {
    return (
      <CardBase title={title} color={item.color.hex}>
        <Flex flexFlow="column" alignItems="center" gap={2}>
          <Text fontSize="sm" color="whiteAlpha.700">
            {t('ItemPage.no-official-list')}
          </Text>
          <ItemOfficialListCTA
            item={item}
            excludeListIds={excludeListIds}
            linkColor={linkColor}
            placement="empty"
          />
        </Flex>
      </CardBase>
    );
  }

  return (
    <CardBase title={title} color={item.color.hex}>
      <Flex
        gap={3}
        flexFlow="row"
        justifyContent="center"
        flexWrap={'wrap'}
        css={{ '& a': { color: linkColor } }}
      >
        {officialLists.map((list, index) => (
          <Flex
            key={list.internal_id}
            position="relative"
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
            {list.dynamicType && (
              <Tooltip label={t('General.dynamic-list')}>
                <Flex
                  asChild
                  position="absolute"
                  top="6px"
                  right="6px"
                  w="18px"
                  h="18px"
                  borderRadius="full"
                  bg="blackAlpha.500"
                  _hover={{ bg: 'blackAlpha.700' }}
                  alignItems="center"
                  justifyContent="center"
                >
                  <MainLink
                    href="/articles/checklists-and-dynamic-lists"
                    trackEvent="dynamic-list-badge"
                    trackEventLabel="item-page"
                    aria-label={t('General.dynamic-list')}
                  >
                    <NextImage
                      src={DynamicIcon}
                      alt=""
                      width={7}
                      style={{ display: 'inline-block' }}
                    />
                  </MainLink>
                </Flex>
              </Tooltip>
            )}
            <Flex mt="-20px" justifyContent={'center'}>
              <Link asChild>
                <MainLink
                  href={getListLink(list)}
                  prefetch="auto"
                  trackEvent="item-official-list"
                  trackEventLabel={list.slug ?? undefined}
                  trackEventData={{ ...trackPosition(index), part: 'cover' }}
                >
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
                </MainLink>
              </Link>
            </Flex>
            <Text textAlign="center" fontSize="sm" fontWeight="bold" css={{ textWrap: 'balance' }}>
              <Link asChild>
                <MainLink
                  href={getListLink(list)}
                  prefetch="auto"
                  trackEvent="item-official-list"
                  trackEventLabel={list.slug ?? undefined}
                  trackEventData={{ ...trackPosition(index), part: 'name' }}
                  style={{ color: 'white' }}
                >
                  {list.name}
                </MainLink>
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
            {!!contexts?.[list.internal_id]?.length && (
              <ListContextFooter contexts={contexts[list.internal_id]} listColor={list.colorHex} />
            )}
          </Flex>
        ))}
      </Flex>
      <ItemOfficialListCTA
        item={item}
        excludeListIds={excludeListIds}
        linkColor={linkColor}
        placement="footer"
      />
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
