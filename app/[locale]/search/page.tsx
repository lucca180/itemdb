import type { Metadata } from 'next';
import { io } from 'next/cache';
import { connection } from 'next/server';
import { cache, Suspense } from 'react';
import { SetMainColor } from '@components/Layout/SetMainColor';
import AppServerLayoutSkeleton from '@components/Layout/AppServerLayoutSkeleton';
import { getStaticAppMetadata } from '@app/utils/appPage';
import { ListService } from '@services/ListService';
import type { UserList } from '@types';
import { signListJWT } from '@utils/api/api-utils';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import { getCachedNow } from '@utils/getCachedNow';
import { routing } from '@utils/locales';
import { getTranslations } from 'next-intl/server';
import { SearchPageClient } from './SearchPageClient';

const mainColor = '#4A5568c7';

type SearchPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    s?: string | string[];
    list_id?: string | string[];
  }>;
};

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const getSearchList = cache(async (listIdParam: string | undefined): Promise<UserList | null> => {
  const list_id = listIdParam ? parseInt(listIdParam, 10) : undefined;
  if (!list_id || Number.isNaN(list_id)) return null;

  // the mariadb pool reads Date.now() synchronously when validating idle connections
  await io();
  const { user } = await getServerCurrentUser();
  return (
    (await ListService.initUser(user).getList({
      listId: list_id,
      username: 'official',
    })) ?? null
  );
});

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const queryParams = await searchParams;
  const [t, userList] = await Promise.all([
    getTranslations(),
    getSearchList(firstSearchParam(queryParams.list_id)),
  ]);
  const query = firstSearchParam(queryParams.s)?.trim();
  const title = userList
    ? `${userList.name} - ${t('Lists.neopets-lists')}`
    : query
      ? `${query} - ${t('Search.search')}`
      : t('Search.search');

  return await getStaticAppMetadata({
    title,
    description: t('Search.search'),
    pathname: '/search',
    noindex: true,
    nofollow: true,
  });
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  return (
    <Suspense fallback={<AppServerLayoutSkeleton />}>
      <SearchPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function SearchPageContent({ searchParams }: Pick<SearchPageProps, 'searchParams'>) {
  const { list_id: listIdParam } = await searchParams;
  const [userList, now] = await Promise.all([
    getSearchList(firstSearchParam(listIdParam)),
    getCachedNow(),
  ]);

  // jwt.sign reads Date.now(); the token must be per request anyway
  if (userList) await connection();
  const listJWT = userList ? signListJWT(userList.internal_id) : null;

  const searchTip = new Date(now).getMinutes() % 5;

  return (
    <>
      <SetMainColor color={mainColor} />
      <SearchPageClient userList={userList} listJWT={listJWT} searchTip={searchTip} />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
