import { Badge, Flex, Link, Text } from '@chakra-ui/react';
import React from 'react';
import { ItemData, UserList } from '../../types';
import CardBase from '../Card/CardBase';
import NextLink from 'next/link';
import NextImage from 'next/image';
import DynamicIcon from '../../public/icons/dynamic.png';
import dynamic from 'next/dynamic';
import Color from 'color';
import { useTranslations } from 'next-intl';
import Image from '../Utils/Image';
import MainLink from '@components/Utils/MainLink';
import { getListLink } from '@components/UserLists/ListCard';

const Markdown = dynamic(() => import('../Utils/Markdown'));

type Props = {
  item: ItemData;
  lists: UserList[];
};

const ItemOfficialLists = (props: Props) => {
  const t = useTranslations();
  const { item, lists } = props;
  const officialLists = lists.filter((list) => list.official && list.visibility === 'public');
  const color = Color(item.color.hex);

  if (!officialLists.length) return null;

  return (
    <CardBase
      title={<Link href="/lists/official">{t('General.official-lists')}</Link>}
      color={item.color.rgb}
    >
      <Flex
        gap={3}
        flexFlow="row"
        justifyContent="center"
        flexWrap={'wrap'}
        css={{ a: { color: color.lightness(70).hex() } }}
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
            boxShadow={'sm'}
            alignItems={'center'}
          >
            <Flex mt="-20px" justifyContent={'center'}>
              <Link asChild>
                <NextLink href={getListLink(list)} prefetch={false}>
                  <Flex
                    width={'40px'}
                    height={'40px'}
                    bg="white"
                    borderRadius={'md'}
                    overflow={'hidden'}
                  >
                    {list.coverURL && (
                      <Image
                        width={40}
                        height={40}
                        quality={90}
                        objectFit={'cover'}
                        src={list.coverURL}
                        alt={list.name}
                        w="40px"
                        h="40px"
                      />
                    )}
                  </Flex>
                </NextLink>
              </Link>
            </Flex>
            <Text textAlign="center" fontSize="sm" fontWeight="bold" css={{ textWrap: 'balance' }}>
              <MainLink
                href={getListLink(list)}
                prefetch={false}
                trackEvent="item-official-list"
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
              </MainLink>
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
      {officialLists.length === 0 && (
        <Flex flexFlow="column" gap={2} justifyContent="center" alignItems="center">
          <Text fontSize="sm" color="gray.200">
            {t('ItemPage.no-official-list')}
          </Text>
        </Flex>
      )}
    </CardBase>
  );
};

export default ItemOfficialLists;

const OfficialText = ({ list }: { list: UserList }) => {
  const t = useTranslations();
  const isHighlight = list.itemInfo?.[0].isHighlight;

  if (isHighlight && list.highlightText) return <Markdown>{list.highlightText}</Markdown>;

  if (list.description) return <Markdown>{list.description.split(/[\r\n]+/)[0]}</Markdown>;

  return <Markdown>{t('ItemPage.list-no-description')}</Markdown>;
};
