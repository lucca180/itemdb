import { Flex, Link, Text, Image } from '@chakra-ui/react';
import React from 'react';
import { ItemData, UserList } from '../../types';
import CardBase from '../Card/CardBase';
import NextLink from 'next/link';
import NextImage from 'next/image';
import DynamicIcon from '../../public/icons/dynamic.png';
import dynamic from 'next/dynamic';
import Color from 'color';
import { useTranslations } from 'next-intl';
const Markdown = dynamic(() => import('../Utils/Markdown'));

type Props = {
  item: ItemData;
  lists: UserList[];
};

const ItemOfficialLists = (props: Props) => {
  const t = useTranslations();
  const { item, lists } = props;
  const officialLists = lists.filter((list) => list.official);
  const color = Color(item.color.hex);

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
        sx={{ a: { color: color.lightness(70).hex() } }}
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
          >
            <Flex mt="-20px" justifyContent={'center'}>
              <Flex
                width={'40px'}
                height={'40px'}
                bg="white"
                borderRadius={'md'}
                overflow={'hidden'}
                as={NextLink}
                href={`/lists/official/${list.internal_id}`}
                prefetch={false}
              >
                {list.coverURL && (
                  <Image width={'40px'} height={'40px'} src={list.coverURL} alt={list.name} />
                )}
              </Flex>
            </Flex>
            <Text
              as={NextLink}
              href={`/lists/official/${list.internal_id}`}
              sx={{ color: 'white !important;' }}
              textAlign="center"
              fontSize="sm"
              fontWeight="bold"
              display={'inline-flex'}
              justifyContent="center"
              alignItems="center"
              prefetch={false}
            >
              {list.name}{' '}
              {list.dynamicType && (
                <NextImage
                  src={DynamicIcon}
                  alt="dynamic list"
                  width={10}
                  style={{ marginLeft: '5px' }}
                />
              )}
            </Text>
            <Text
              textAlign="center"
              fontSize="sm"
              color="whiteAlpha.800"
              sx={{ 'b, strong': { color: 'white' } }}
              as="div"
            >
              <Markdown>
                {(list.description || t('ItemPage.list-no-description')).split(/[\r\n]+/)[0]}
              </Markdown>
            </Text>
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
