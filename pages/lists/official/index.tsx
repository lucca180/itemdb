import {
  Flex,
  Heading,
  Text,
  Divider,
  Button,
  useDisclosure,
  Select,
  useBreakpointValue,
  Center,
  Spinner,
} from '@chakra-ui/react';
import HeaderCard from '../../../components/Card/HeaderCard';
import Layout from '../../../components/Layout';
import { ApplyListModalProps } from '../../../components/Modal/OfficialListApply';
import UserListCard from '../../../components/UserLists/ListCard';
import { UserList } from '../../../types';
import { useAuth } from '../../../utils/auth';
import { getOfficialListsCat, getUserLists } from '../../api/v1/lists/[username]';
import dynamic from 'next/dynamic';
import { createTranslator, useTranslations } from 'next-intl';
import useSWRImmutable from 'swr/immutable';
import axios from 'axios';
import { ReactElement, useMemo, useState } from 'react';
import { ViewportList } from 'react-viewport-list';
import { SearchList } from '../../../components/Search/SearchLists';
import { useRouter } from 'next/router';
import { Breadcrumbs } from '../../../components/Breadcrumbs/Breadcrumbs';
import { loadTranslation } from '@utils/load-translation';

const fetcher = (url: string) => axios.get(url).then((res) => res.data as UserList[]);

const ApplyListModal = dynamic<ApplyListModalProps>(
  () => import('../../../components/Modal/OfficialListApply')
);

type Props = {
  lists: UserList[];
  messages: any;
  locale: string;
};

const OfficialListsPage = (props: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const { user, authLoading } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [filteredLists, setFilteredLists] = useState<UserList[]>();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const rowSize = useBreakpointValue({ base: 2, xl: 3 }, { fallback: 'xl' });

  const { data: lists, isLoading } = useSWRImmutable(
    `/api/v1/lists/official?includeItems=false`,
    fetcher,
    {
      shouldRetryOnError: false,
    }
  );

  const categories = useMemo(() => {
    if (!lists) return [];
    const newCats = [...new Set(lists.map((list) => list.officialTag || 'Uncategorized'))].sort(
      (a, b) => a.localeCompare(b)
    );
    return newCats;
  }, [lists]);

  const handleFilter = (value: string) => {
    if (!lists) return props.lists;
    setSelectedCategory(value);

    if (value === 'all') {
      setFilteredLists(lists);
      return lists;
    } else if (value === 'Uncategorized') {
      const filtered = lists
        .filter((x) => !x.officialTag)
        .sort((a, b) => a.name.localeCompare(b.name));
      setFilteredLists(filtered);
      return filtered;
    } else {
      const filtered = lists
        .filter((x) => x.officialTag === value)
        .sort((a, b) => a.name.localeCompare(b.name));
      setFilteredLists(filtered);
      return filtered;
    }
  };

  const handleSearch = (search: string) => {
    if (!lists && !props.lists) return;
    const allLists = lists ?? props.lists;
    let newFilteredLists = allLists;

    if (selectedCategory != 'all')
      newFilteredLists = allLists.filter((x) => x.officialTag === selectedCategory);

    if (!search) {
      setFilteredLists(newFilteredLists);
      return;
    }

    const searchLower = search.toLowerCase();
    setFilteredLists(
      newFilteredLists.filter(
        (x) =>
          x.name.toLowerCase().includes(searchLower) ||
          (x.description ?? '').toLowerCase().includes(searchLower)
      )
    );
  };

  const cat = router.query.cat as string;
  const actualLists =
    filteredLists ?? (cat ? handleFilter(cat) : undefined) ?? lists ?? props.lists;

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

  return (
    <>
      <ApplyListModal isOpen={isOpen} onClose={onClose} />
      <HeaderCard
        image={{
          src: 'https://images.neopets.com/games/tradingcards/premium/0911.gif',
          alt: 'grundo warehouse thumbnail',
        }}
        color="#4962ec"
        breadcrumb={
          <Breadcrumbs
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
            ]}
          />
        }
      >
        <Heading as="h1" size="lg">
          {t('General.official-lists')}
        </Heading>
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
              {actualLists && (
                <>
                  {actualLists.length} {t('General.lists')}
                </>
              )}
            </Text>
          </Flex>
          <Flex flex="1" justifyContent="flex-end" alignItems={'center'} gap={3}>
            <SearchList onChange={handleSearch} disabled={isLoading} />
            <Text as="div" textColor={'gray.300'} flex="0 0 auto" fontSize="sm">
              {t('Lists.filter-by-type')}
            </Text>
            <Select
              isDisabled={!categories.length}
              onChange={(e) => handleFilter(e.target.value)}
              value={selectedCategory}
              maxW="150px"
              variant="outlined"
              size="sm"
            >
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
          {isLoading && (
            <Center>
              <Spinner />
            </Center>
          )}
        </Flex>
      </Flex>
    </>
  );
};

export default OfficialListsPage;

export async function getStaticProps(context: any) {
  const category = context.query.cat;
  const lists = category
    ? await getOfficialListsCat(category, 15)
    : await getUserLists('official', null, 15);

  return {
    props: {
      lists,
      messages: await loadTranslation(context.locale as string, 'lists/official/index'),
      locale: context.locale,
    },
    revalidate: 120,
  };
}

OfficialListsPage.getLayout = function getLayout(page: ReactElement, props: Props) {
  const t = createTranslator({ messages: props.messages, locale: props.locale });

  const canonical =
    props.locale === 'en'
      ? `https://itemdb.com.br/lists/official`
      : `https://itemdb.com.br/${props.locale}/lists/official`;

  return (
    <Layout
      SEO={{
        title: t('General.official-lists'),
        canonical: canonical,
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
      {page}
    </Layout>
  );
};
