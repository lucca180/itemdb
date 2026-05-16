import { GetServerSidePropsContext } from 'next/types';
import queryString from 'query-string';
import { SearchFilters, SearchResults, SearchStats, UserList } from '../../types';
import { generateListJWT } from '../api-utils';
import { loadTranslation } from '../load-translation';
import { defaultFilters, getFiltersDiff } from '../parseFilters';

export type SearchPageServerProps = {
  listJWT?: string | null;
  userList?: UserList | null;
  searchTip: number;
  initialFilters?: SearchFilters | null;
  initialSearchQuery?: string;
  initialSearchResult?: SearchResults | null;
  initialTotalResults?: number | null;
  initialSearchStatus?: SearchStats | null;
  messages: Record<string, any>;
};

export const getSearchPageServerProps = async (
  context: GetServerSidePropsContext
): Promise<{ props: SearchPageServerProps }> => {
  const parsedListId = context.query?.list_id ? parseInt(context.query.list_id as string) : NaN;
  const listId = !isNaN(parsedListId) ? parsedListId : 0;
  const query = (context.query.s as string) ?? '';
  const queryStrings = queryString.parse(context.resolvedUrl.split('?')[1] || '', {
    arrayFormat: 'bracket',
    parseNumbers: true,
  });
  const initialFilters = omitUndefinedValues({
    ...defaultFilters,
    ...getFiltersDiff(queryStrings),
  }) as SearchFilters;

  let listJWT = null;
  let userList = null;

  if (listId) {
    const result = await generateListJWT(listId, context.req as any);
    if (result) {
      listJWT = result.token;
      userList = result.list;
    }
  }

  const totalTips = 4;
  const searchTip = new Date().getMinutes() % totalTips;
  let initialSearchResult: SearchResults | null = null;
  let initialSearchCount: SearchResults | null = null;

  try {
    const { doSearch } = await import('../../pages/api/v1/search');

    [initialSearchResult, initialSearchCount] = await Promise.all([
      doSearch(query, initialFilters, false, listId, false, false),
      doSearch(query, { ...initialFilters, limit: 1 }, false, listId, false, true),
    ]);
  } catch (err) {
    console.error(err);
  }

  return {
    props: {
      listJWT,
      userList,
      searchTip,
      initialFilters,
      initialSearchQuery: query,
      initialSearchResult,
      initialTotalResults: initialSearchCount?.totalResults ?? null,
      initialSearchStatus: null,
      messages: await loadTranslation(context.locale!, 'search'),
    },
  };
};

const omitUndefinedValues = (value: Record<string, any>) =>
  Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
