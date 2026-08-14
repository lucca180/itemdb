import { cache } from 'react';
import { getListMatchesMany, type ListMatchTargetType } from '@pages/api/v1/lists/match/many';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import {
  filterSeekingLists,
  filterTradingLists,
} from '@app/_components/Item/NCTrade/ncTradeListFilters';
import type { UserList } from '@types';

const MATCH_FILTERS = {
  seeker: filterSeekingLists,
  offerer: filterTradingLists,
} as const;

export const loadListMatches = cache(
  async (
    tradeLists: UserList[] | undefined,
    targetType: ListMatchTargetType,
    sessionCookie?: string
  ) => {
    const { user } = await getServerCurrentUser();
    if (!user?.username) return null;

    const usernames = MATCH_FILTERS[targetType](tradeLists)
      .map((list) => list.owner?.username)
      .filter((username): username is string => !!username);

    if (!usernames.length) return {};
    return getListMatchesMany(user.username, usernames, targetType, sessionCookie);
  }
);
