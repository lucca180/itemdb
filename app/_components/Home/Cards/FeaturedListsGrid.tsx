'use client';

import type { UserList } from '@types';
import { Flex } from '@styled/jsx';
import UserListCard from '@components/UserLists/ListCard';

type FeaturedListsGridProps = {
  lists: UserList[];
};

export function FeaturedListsGrid(props: FeaturedListsGridProps) {
  const { lists } = props;

  return (
    <Flex flexWrap="wrap" gap={4} justifyContent="center">
      {lists.map((list) => (
        <UserListCard key={list.internal_id} list={list} utm_content="featured-lists" />
      ))}
    </Flex>
  );
}
