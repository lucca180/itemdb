import {
  Flex,
  Heading,
  Text,
  Divider,
  useBreakpointValue,
  Skeleton,
  Spinner,
  Center,
} from '@chakra-ui/react';
import HeaderCard from '../../../../components/Card/HeaderCard';
import Layout from '../../../../components/Layout';
import UserListCard from '../../../../components/UserLists/ListCard';
import { UserList } from '../../../../types';
import { createTranslator, useTranslations } from 'next-intl';
import useSWRImmutable from 'swr/immutable';
import axios from 'axios';
import { ReactElement, useEffect, useMemo, useState } from 'react';
import { ViewportList } from 'react-viewport-list';
import { SearchList } from '../../../../components/Search/SearchLists';
import { Breadcrumbs } from '../../../../components/Breadcrumbs/Breadcrumbs';
import { loadTranslation } from '@utils/load-translation';
import { ListService } from '@services/ListService';

const fetcher = (url: string) => axios.get(url).then((res) => res.data as UserList[]);

type Props = {
  lists: UserList[];
  messages: any;
  locale: string;
  selectedCategory: string;
};

const OfficialListsCatPage = (props: Props) => {
  const { selectedCategory } = props;
  const t = useTranslations();
  const [lists, setLists] = useState<UserList[]>(props.lists);
  const rowSize = useBreakpointValue({ base: 2, xl: 3 }, { fallback: 'xl' });

  const catInfo = listCategoriesData[selectedCategory];

  const { data, isLoading } = useSWRImmutable(
    `/api/v1/lists/official?officialTag=${catInfo.id}`,
    fetcher,
    {
      shouldRetryOnError: false,
    }
  );

  const handleFilter = (value: string) => {
    if (!data) return;

    if (value === 'all') {
      setLists(data);
    } else if (value.toLowerCase() === 'uncategorized') {
      setLists(
        data.filter((x) => !x.officialTag).sort((a, b) => sortLists(a, b, catInfo.featured))
      );
    } else {
      setLists(
        data
          .filter((x) => x.officialTag?.toLowerCase() === value.toLowerCase())
          .sort((a, b) => sortLists(a, b, catInfo.featured))
      );
    }
  };

  const handleSearch = (search: string) => {
    if (!data) return;
    let filteredLists = data;

    filteredLists = data.filter(
      (x) => x.officialTag?.toLowerCase() === selectedCategory.toLowerCase()
    );

    if (!search) {
      setLists(filteredLists);
      return;
    }

    const searchLower = search.toLowerCase();
    setLists(
      filteredLists.filter(
        (x) =>
          x.name.toLowerCase().includes(searchLower) ||
          (x.description ?? '').toLowerCase().includes(searchLower)
      )
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
    [lists, rowSize]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    handleFilter(catInfo.id);
  }, [data]);

  return (
    <>
      <HeaderCard
        image={{
          src: catInfo.url,
          alt: selectedCategory + ' thumbnail',
        }}
        color={catInfo.color}
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
              {
                position: 3,
                name: catInfo.name,
                item: '/lists/official/' + selectedCategory.toLowerCase(),
              },
            ]}
          />
        }
      >
        <Heading as="h1" size="lg">
          {catInfo.name}
        </Heading>
        <Text size={{ base: 'sm', md: undefined }}>{catInfo.description}</Text>
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
            <Skeleton isLoaded={!isLoading}>
              <Text as="div" textColor={'gray.300'} fontSize="sm">
                {lists && (
                  <>
                    {lists.length} {t('General.lists')}
                  </>
                )}
              </Text>
            </Skeleton>
          </Flex>
          <Flex flex="1" justifyContent="flex-end" alignItems={'center'} gap={3}>
            <SearchList onChange={handleSearch} disabled={isLoading} />
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

export default OfficialListsCatPage;

export async function getServerSideProps(context: any) {
  const category = context.params.category;
  const tag = (listCategoriesData[category]?.id ?? category).toLowerCase();

  if (!listCategoriesData[category]) {
    return {
      redirect: {
        destination: '/lists/official?cat=' + category,
        permanent: false,
      },
    };
  }

  const listService = ListService.init();

  const lists = (await listService.getOfficialListsCat(tag, 3000))
    .sort((a, b) => sortLists(a, b, listCategoriesData[category].featured))
    .splice(0, 15);

  context.res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=300');

  return {
    props: {
      lists: lists,
      selectedCategory: category,
      messages: await loadTranslation(context.locale as string, 'lists/official/cat/[category]'),
      locale: context.locale,
    },
  };
}

OfficialListsCatPage.getLayout = function getLayout(page: ReactElement, props: Props) {
  const t = createTranslator({ messages: props.messages, locale: props.locale });
  const catInfo = listCategoriesData[props.selectedCategory];
  return (
    <Layout
      SEO={{
        title: `${catInfo.name} - ${t('General.official-lists')}`,
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
      mainColor={catInfo.color + 'c7'}
    >
      {page}
    </Layout>
  );
};

export const listCategoriesData: {
  [cat: string]: {
    id: string;
    name: string;
    url: string;
    color: string;
    description: string;
    featured?: string[];
  };
} = {
  dailies: {
    id: 'dailies',
    name: 'Neopets Dailies',
    url: 'https://images.neopets.com/images/frontpage/y7_day.gif',
    color: '#D663A6',
    description:
      'Discover complete prize lists from Neopets Dailies! Stay updated on the latest items from Neopets Freebies and never miss a daily freebie again.',
  },
  'advent-calendar': {
    id: 'advent calendar',
    name: 'Advent Calendar',
    url: 'https://images.neopets.com/games/tradingcards/premium/0612.gif',
    color: '#FF0000',
    description:
      'Explore the Advent Calendar lists and uncover the latest items and prizes from Neopets Advent Calendar Event!',
  },
  'altador-cup': {
    id: 'altador cup',
    name: 'Altador Cup',
    url: 'https://images.neopets.com/nt/nt_images/548_altadorcup_referee.gif',
    color: '#FFCC00',
    description:
      'Explore the Altador Cup lists and uncover the latest prizes from Neopets Altador Cup Event!',
  },
  'festival-of-neggs': {
    id: 'festival of neggs',
    name: 'Festival of Neggs',
    url: 'https://images.neopets.com/neopies/2010/finalists/byd32vcnx73a/03.jpg',
    color: '#8FAA37',
    description:
      'Discover the complete prize list from current and past Festival of Neggs Neopets events!',
  },
  'quest-log': {
    id: 'quest log',
    name: 'Quest Log Prizes',
    url: 'https://images.neopets.com/neopies/y25/images/nominees/Surprise_2sytnvcmnj/04.png',
    color: '#F3C242',
    description:
      'Explore prize lists from current and past Quest Log prizes! Stay updated on the latest Daily Quests Prizes, find the best Weekly Prizes and make Neopoints easily! ',
    featured: ['weekly-quest-prize', 'daily-quest-prize', 'premium-daily-quest-prizes'],
  },
  stamps: {
    id: 'stamps',
    name: 'Stamp Album',
    url: 'https://images.neopets.com/nt/ntimages/351_lenny_stamps.gif',
    color: '#FFCC00',
    description:
      'Explore detailed checklists for each Neopets Stamp Album page! Track your stamps and complete your collection with ease.',
  },
};

const sortLists = (a: UserList, b: UserList, featured?: string[]) => {
  if (featured) {
    const aIndex = featured.indexOf(a.slug?.toLowerCase() ?? '');
    const bIndex = featured.indexOf(b.slug?.toLowerCase() ?? '');
    if (aIndex !== -1 && bIndex === -1) return -1;
    if (aIndex === -1 && bIndex !== -1) return 1;
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
  }
  return a.name.localeCompare(b.name);
};
