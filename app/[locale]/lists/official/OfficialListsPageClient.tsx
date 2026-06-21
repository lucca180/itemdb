'use client';

import {
  Flex,
  Heading,
  Text,
  Button,
  useDisclosure,
  NativeSelect,
  useBreakpointValue,
  Skeleton,
} from '@chakra-ui/react';
import { ApplyListModalProps } from '@components/Modal/OfficialListApply';
import UserListCard from '@components/UserLists/ListCard';
import { UserList } from '@types';
import { useAuth } from '@utils/auth';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useRouter } from '@i18n/navigation';
import {
  ChangeEvent,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ViewportList } from 'react-viewport-list';
import { SearchList } from '@components/Search/SearchLists';

const ApplyListModal = dynamic<ApplyListModalProps>(
  () => import('@components/Modal/OfficialListApply'),
  { ssr: false }
);

type ListsData = {
  allLists: UserList[];
  categories: string[];
};

type OfficialListsPageContextValue = {
  selectedCategory: string;
  isSearch: boolean;
  listsData: ListsData | null;
  actualLists: UserList[];
  setListsData: (data: ListsData) => void;
  setSelectedCategory: (value: string) => void;
  setFilteredLists: (lists: UserList[] | undefined) => void;
  setIsSearch: (value: boolean) => void;
};

const OfficialListsPageContext = createContext<OfficialListsPageContextValue | null>(null);

function useOfficialListsPage() {
  const context = useContext(OfficialListsPageContext);
  if (!context) {
    throw new Error('useOfficialListsPage must be used within OfficialListsPageClient');
  }
  return context;
}

type PageProps = {
  initialCat?: string;
  children: ReactNode;
};

export function OfficialListsPageClient({ initialCat, children }: PageProps) {
  const t = useTranslations();
  const { user, authLoading } = useAuth();
  const { open: isOpen, onOpen, onClose } = useDisclosure();
  const [selectedCategory, setSelectedCategory] = useState(initialCat || 'all');
  const [isSearch, setIsSearch] = useState(false);
  const [listsData, setListsData] = useState<ListsData | null>(null);
  const [filteredLists, setFilteredLists] = useState<UserList[] | undefined>();

  const categoryFilteredLists = useMemo(() => {
    if (!listsData) return [];
    const { allLists } = listsData;

    if (selectedCategory === 'all') return allLists;

    if (selectedCategory === 'Uncategorized') {
      return allLists
        .filter((x) => x.officialTag.length === 0)
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    return allLists
      .filter((x) => x.officialTag.includes(selectedCategory))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [listsData, selectedCategory]);

  const actualLists = filteredLists ?? categoryFilteredLists;

  const handleFilter = (value: string) => {
    setSelectedCategory(value);
    setFilteredLists(undefined);
    setIsSearch(false);
  };

  const handleSearch = (search: string) => {
    if (!listsData) return;

    if (!search) {
      setIsSearch(false);
      setFilteredLists(undefined);
      return;
    }

    setIsSearch(true);

    const searchLower = search.toLowerCase();
    setFilteredLists(
      categoryFilteredLists.filter(
        (x) =>
          x.name.toLowerCase().includes(searchLower) ||
          (x.description ?? '').toLowerCase().includes(searchLower)
      )
    );
  };

  const contextValue = useMemo(
    () => ({
      selectedCategory,
      isSearch,
      listsData,
      actualLists,
      setListsData,
      setSelectedCategory,
      setFilteredLists,
      setIsSearch,
    }),
    [selectedCategory, isSearch, listsData, actualLists]
  );

  return (
    <OfficialListsPageContext.Provider value={contextValue}>
      <ApplyListModal isOpen={isOpen} onClose={onClose} />
      <Flex flexFlow="column" gap={3}>
        <Flex
          flexFlow={{ base: 'column', sm: 'row' }}
          py={3}
          gap={3}
          flexWrap="wrap"
          alignItems="center"
        >
          <Flex alignItems="center" gap={3}>
            <Button variant="subtle" loading={authLoading} onClick={onOpen} disabled={!user}>
              + {t('Lists.official-apply-list')}
            </Button>
            {!listsData ? (
              <Skeleton h="20px" w="80px" />
            ) : (
              <Text as="div" color={'gray.300'} fontSize="sm">
                {actualLists.length} {t('General.lists')}
              </Text>
            )}
          </Flex>
          <Flex flex="1" justifyContent="flex-end" alignItems={'center'} gap={3}>
            <SearchList onChange={handleSearch} disabled={!listsData} />
            <Text as="div" color={'gray.300'} flex="0 0 auto" fontSize="sm">
              {t('Lists.filter-by-type')}
            </Text>
            <NativeSelect.Root
              disabled={!listsData?.categories.length}
              maxW="150px"
              size="sm"
              variant="outline"
            >
              <NativeSelect.Field
                onChange={(e: ChangeEvent<HTMLSelectElement>) => handleFilter(e.target.value)}
                value={selectedCategory}
              >
                <option value="all">{t('Lists.show-all')}</option>
                {(listsData?.categories ?? []).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Flex>
        </Flex>
        <Flex mt={0} gap={4} flexFlow="column">
          {children}
        </Flex>
      </Flex>
    </OfficialListsPageContext.Provider>
  );
}

type TrendingSlotProps = {
  trendingLists: UserList[];
  canEdit: boolean;
};

export function OfficialTrendingListsSlot({ trendingLists, canEdit }: TrendingSlotProps) {
  const t = useTranslations();
  const router = useRouter();
  const { selectedCategory, isSearch } = useOfficialListsPage();

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  if (!trendingLists.length || selectedCategory !== 'all' || isSearch) {
    return null;
  }

  return (
    <Flex flexFlow="column" gap={3} bg="blackAlpha.500" p={4} borderRadius="md">
      <Heading size="md">{t('Lists.trending-lists')}</Heading>
      <Flex gap={3} justifyContent="center" flexWrap={'wrap'}>
        {trendingLists.map((list) => (
          <UserListCard
            canEdit={canEdit}
            key={list.internal_id}
            list={list}
            utm_content="official-trending"
            refresh={refresh}
          />
        ))}
      </Flex>
    </Flex>
  );
}

type AllListsSlotProps = {
  allLists: UserList[];
  categories: string[];
  canEdit: boolean;
};

export function OfficialAllListsSlot({ allLists, categories, canEdit }: AllListsSlotProps) {
  const t = useTranslations();
  const router = useRouter();
  const { selectedCategory, isSearch, actualLists, setListsData } = useOfficialListsPage();
  const rowSize = useBreakpointValue({ base: 2, xl: 3 }, { fallback: 'xl' });

  useEffect(() => {
    setListsData({ allLists, categories });
  }, [allLists, categories, setListsData]);

  const groupedLists = useMemo(
    () =>
      actualLists.reduce((acc, cur, i) => {
        const groupIndex = Math.floor(i / (rowSize ?? 3));
        if (!acc[groupIndex]) acc[groupIndex] = [];
        acc[groupIndex].push(cur);
        return acc;
      }, [] as UserList[][]),
    [actualLists, rowSize]
  );

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <Flex flexFlow="column" gap={3} bg="blackAlpha.500" p={4} borderRadius="md">
      {!isSearch && actualLists.length > 0 && (
        <Heading size="md">
          {selectedCategory === 'all' ? t('Lists.newest-lists') : selectedCategory}
        </Heading>
      )}

      <ViewportList items={groupedLists} viewportRef={null} initialPrerender={3} overscan={3}>
        {(group, index) => (
          <Flex gap={[3]} key={index} justifyContent="center" flexWrap={'wrap'}>
            {group.map((list) => (
              <UserListCard
                canEdit={canEdit}
                key={list.internal_id}
                list={list}
                refresh={refresh}
              />
            ))}
          </Flex>
        )}
      </ViewportList>

      {!actualLists.length && (
        <Text as="div" textAlign="center" py={10} fontSize="lg" fontWeight="bold">
          {t('Lists.no-lists-found')}
        </Text>
      )}
    </Flex>
  );
}
