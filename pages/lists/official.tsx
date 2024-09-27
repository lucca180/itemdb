import {
  Flex,
  Heading,
  Text,
  Divider,
  Button,
  useDisclosure,
  Select,
  useBreakpointValue,
} from '@chakra-ui/react';
import HeaderCard from '../../components/Card/HeaderCard';
import Layout from '../../components/Layout';
import { ApplyListModalProps } from '../../components/Modal/OfficialListApply';
import UserListCard from '../../components/UserLists/ListCard';
import { UserList } from '../../types';
import { useAuth } from '../../utils/auth';
import { getUserLists } from '../api/v1/lists/[username]';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import useSWRImmutable from 'swr/immutable';
import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { ViewportList } from 'react-viewport-list';
import { SearchList } from '../../components/Search/SearchLists';

const fetcher = (url: string) => axios.get(url).then((res) => res.data as UserList[]);

const ApplyListModal = dynamic<ApplyListModalProps>(
  () => import('../../components/Modal/OfficialListApply'),
);

type Props = {
  lists: UserList[];
};

const OfficialListsPage = (props: Props) => {
  const t = useTranslations();
  const { user, authLoading } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [lists, setLists] = useState<UserList[]>(props.lists);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const rowSize = useBreakpointValue({ base: 2, xl: 3 }, { fallback: 'xl' });

  const { data } = useSWRImmutable(`/api/v1/lists/official?includeItems=false`, fetcher, {
    shouldRetryOnError: false,
  });

  useEffect(() => {
    if (data) {
      const newCats = [...new Set(data.map((list) => list.officialTag || 'Uncategorized'))].sort(
        (a, b) => a.localeCompare(b),
      );

      setLists(data);
      setCategories(newCats);
    }
  }, [data]);

  const handleFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!data) return;
    setSelectedCategory(value);

    if (value === 'all') {
      setLists(data);
    } else if (value === 'Uncategorized') {
      setLists(data.filter((x) => !x.officialTag).sort((a, b) => a.name.localeCompare(b.name)));
    } else {
      setLists(
        data.filter((x) => x.officialTag === value).sort((a, b) => a.name.localeCompare(b.name)),
      );
    }
  };

  const handleSearch = (search: string) => {
    if (!data) return;
    let filteredLists = data;

    if (selectedCategory != 'all')
      filteredLists = data.filter((x) => x.officialTag === selectedCategory);

    if (!search) {
      setLists(filteredLists);
      return;
    }

    const searchLower = search.toLowerCase();
    setLists(
      filteredLists.filter(
        (x) =>
          x.name.toLowerCase().includes(searchLower) ||
          (x.description ?? '').toLowerCase().includes(searchLower),
      ),
    );
  };

  const groupedLists = useMemo(
    () =>
      lists.reduce((acc, cur, i) => {
        const groupIndex = Math.floor(i / (rowSize ?? 3));
        if (!acc[groupIndex]) acc[groupIndex] = [];
        acc[groupIndex].push(cur);
        return acc;
      }, [] as UserList[][]),
    [lists, rowSize],
  );

  return (
    <Layout
      SEO={{
        title: t('General.official-lists'),
        description: t('Lists.officialList-description'),
        openGraph: {
          images: [
            {
              url: 'https://images.neopets.com/games/tradingcards/premium/0911.gif',
              width: 150,
              height: 150,
            },
          ],
        },
      }}
      mainColor="#4962ecc7"
    >
      <ApplyListModal isOpen={isOpen} onClose={onClose} />
      <HeaderCard
        image={{
          src: 'https://images.neopets.com/games/tradingcards/premium/0911.gif',
          alt: 'grundo warehouse thumbnail',
        }}
        color="#4962ec"
      >
        <Heading size="lg">{t('General.official-lists')}</Heading>
        <Text size={{ base: 'sm', md: undefined }}>
          {t.rich('Lists.officialList-subheader', {
            br: () => <br />,
          })}
        </Text>
      </HeaderCard>
      <Divider />
      <Flex flexFlow="column" gap={3}>
        <Flex
          flexFlow={{ base: 'column', sm: 'row' }}
          py={3}
          gap={3}
          flexWrap="wrap"
          alignItems="center"
        >
          <Flex alignItems="center" gap={3}>
            <Button variant="solid" isLoading={authLoading} onClick={onOpen} isDisabled={!user}>
              + {t('Lists.official-apply-list')}
            </Button>
            <Text as="div" textColor={'gray.300'} fontSize="sm">
              {lists && (
                <>
                  {lists.length} {t('General.lists')}
                </>
              )}
            </Text>
          </Flex>
          <Flex flex="1" justifyContent="flex-end" alignItems={'center'} gap={3}>
            <SearchList onChange={handleSearch} />
            <Text as="div" textColor={'gray.300'} flex="0 0 auto" fontSize="sm">
              {t('Lists.filter-by-type')}
            </Text>
            <Select onChange={handleFilter} maxW="150px" variant="outlined" size="sm">
              <option value="all">{t('Lists.show-all')}</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
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
    </Layout>
  );
};

export default OfficialListsPage;

export async function getServerSideProps(context: any) {
  const lists = await getUserLists('official', null, 15);

  return {
    props: {
      lists,
      messages: (await import(`../../translation/${context.locale}.json`)).default,
    },
  };
}
