import type { UserList } from '@types';

export function getListLink(list: UserList) {
  if (list.dynamicType === 'search') {
    return `/search?list_id=${list.internal_id}`;
  }

  return `/lists/${list.official ? 'official' : list.owner.username}/${list.slug ?? list.internal_id}`;
}
