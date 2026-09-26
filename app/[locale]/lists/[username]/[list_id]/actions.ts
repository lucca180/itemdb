'use server';

import { updateTag } from 'next/cache';
import { headers } from 'next/headers';
import requestIp from 'request-ip';
import type { SearchFilters, SearchStats, UserList } from '@types';
import { defaultFilters, getFiltersDiff } from '@utils/parseFilters';
import { listMutationCacheTags } from '@utils/appCacheTags';
import { ListService } from '@services/ListService';
import {
  submitListSuggestion,
  SuggestionInputError,
  type ListSuggestionErrorCode,
  type SubmitListSuggestionResult,
} from '@services/ListSuggestionService';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import { normalizeIP } from '@utils/api/api-utils';
import { getFilteredListItems, getListCore, getListFullItems, getListStats } from './loadListPage';
import type { ListCore, ListItemsData } from './listPage';

function invalidateListMutationCaches(core: ListCore) {
  const username = core.list.official ? 'official' : (core.list.owner.username ?? '');
  for (const tag of listMutationCacheTags(username, core.list.internal_id)) {
    updateTag(tag);
  }
}

export async function loadListStats(
  locale: string,
  username: string,
  list_id: string
): Promise<SearchStats> {
  const core = await getListCore(locale, username, list_id);
  return getListStats(core);
}

export async function loadRemainingListItems(
  locale: string,
  username: string,
  list_id: string
): Promise<ListItemsData> {
  const core = await getListCore(locale, username, list_id);
  return getListFullItems(core);
}

export async function applyListFilters(
  locale: string,
  username: string,
  list_id: string,
  filters: SearchFilters
): Promise<ListItemsData> {
  const core = await getListCore(locale, username, list_id);
  const diff = getFiltersDiff(filters);
  const hasFilters = Object.keys(diff).length > 0;

  if (!hasFilters) {
    return getListFullItems(core);
  }

  return getFilteredListItems(core, { ...defaultFilters, ...diff });
}

export async function refreshListData(
  locale: string,
  username: string,
  list_id: string
): Promise<{ list: UserList; items: ListItemsData }> {
  const core = await getListCore(locale, username, list_id);
  invalidateListMutationCaches(core);

  const listService = ListService.initUser(core.viewer);
  const list =
    (await listService.getList({
      username,
      list_id_or_slug: list_id,
      isOfficial: username === 'official',
    })) ?? core.list;
  const items = await getListFullItems({ ...core, list });

  return { list, items };
}

/**
 * Submits a "missing item" suggestion for an official list (SuggestListItemModal).
 * Never throws for expected errors: returns `{ success: false, error }` so the modal can
 * show a translated message.
 */
export async function suggestMissingListItems(
  listId: number,
  itemIids: number[],
  note?: string
): Promise<
  | ({ success: true } & SubmitListSuggestionResult)
  | { success: false; error: ListSuggestionErrorCode | 'unknown' }
> {
  try {
    const { user } = await getServerCurrentUser();
    // server actions have no req object: build a req-like one so request-ip can read the headers
    const headerStore = await headers();
    const reqLike = { headers: Object.fromEntries(headerStore.entries()) };
    const ip = requestIp.getClientIp(reqLike as Parameters<typeof requestIp.getClientIp>[0]);

    const result = await submitListSuggestion({
      listId,
      itemIids,
      note,
      user,
      ip: ip ? normalizeIP(ip) : null,
    });

    return { success: true, ...result };
  } catch (error) {
    if (error instanceof SuggestionInputError) return { success: false, error: error.code };

    console.error(error);
    return { success: false, error: 'unknown' };
  }
}
