'use client';

import { Flex, Heading, Text, Separator, useBreakpointValue } from '@chakra-ui/react';
import HeaderCard from '@components/Card/HeaderCard';
import UserListCard from '@components/UserLists/ListCard';
import { UserList } from '@types';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { ViewportList } from 'react-viewport-list';
import { SearchList } from '@components/Search/SearchLists';
import { BreadcrumbsView } from '@components/Breadcrumbs/BreadcrumbsView';
import { listCategoriesData } from '@utils/lists/listCategoriesData';

type Props = {
  lists: UserList[];
  locale: string;
  selectedCategory: string;
};

export function OfficialListsCatPageClient(props: Props) {
  const { selectedCategory, locale, lists: allLists } = props;
  const t = useTranslations();
  const [filteredLists, setFilteredLists] = useState<UserList[] | undefined>();
  const rowSize = useBreakpointValue({ base: 2, xl: 3 }, { fallback: 'xl' });

  const catInfo = listCategoriesData[selectedCategory];

  const handleSearch = (search: string) => {
    if (!search) {
      setFilteredLists(undefined);
      return;
    }

    const searchLower = search.toLowerCase();
    setFilteredLists(
      allLists.filter(
        (x) =>
          x.name.toLowerCase().includes(searchLower) ||
          (x.description ?? '').toLowerCase().includes(searchLower)
      )
    );
  };

  const lists = filteredLists ?? allLists;

  const groupedLists = useMemo(
    () =>
      lists.reduce((acc, cur, i) => {
        const groupIndex = Math.floor(i / (rowSize ?? 3));
        if (!acc[groupIndex]) acc[groupIndex] = [];
        acc[groupIndex].push(cur);
        return acc;
      }, [] as UserList[][]),
    [lists, rowSize]
  );

  return (
    <>
      <HeaderCard
        image={{
          src: catInfo.url,
          alt: selectedCategory + ' thumbnail',
        }}
        color={catInfo.color}
        breadcrumb={
          <BreadcrumbsView
            locale={locale}
            useAppDir
            breadcrumbList={[
              {
                position: 1,
                name: t('Layout.home'),
                item: '/',
              },
              {
                position: 2,
                name: t('General.official-lists'),
                item: '/lists/official',
              },
              {
                position: 3,
                name: catInfo.name,
                item: `/lists/official/cat/${selectedCategory}`,
              },
            ]}
          />
        }
      >
        <Heading as="h1" size="lg">
          {catInfo.name}
        </Heading>
        <Text fontSize={{ base: 'sm', md: undefined }}>{catInfo.description}</Text>
      </HeaderCard>
      <Separator />
      <Flex flexFlow="column" gap={3}>
        <Flex
          flexFlow={{ base: 'column', sm: 'row' }}
          py={3}
          gap={3}
          flexWrap="wrap"
          alignItems="center"
        >
          <Flex alignItems="center" gap={3}>
            <Text as="div" color={'gray.300'} fontSize="sm">
              {lists.length} {t('General.lists')}
            </Text>
          </Flex>
          <Flex flex="1" justifyContent="flex-end" alignItems={'center'} gap={3}>
            <SearchList onChange={handleSearch} />
          </Flex>
        </Flex>
        <Flex mt={0} gap={4} flexFlow="column">
          <ViewportList items={groupedLists} viewportRef={null} initialPrerender={3} overscan={3}>
            {(group, index) => (
              <Flex gap={[3]} key={index} justifyContent="center" flexWrap={'wrap'}>
                {group.map((list) => (
                  <UserListCard key={list.internal_id} list={list} />
                ))}
              </Flex>
            )}
          </ViewportList>
        </Flex>
      </Flex>
    </>
  );
}
