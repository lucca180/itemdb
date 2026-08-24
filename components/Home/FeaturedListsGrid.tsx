import { Flex } from '@chakra-ui/react';
import type { UserList } from '@types';
import UserListCard from '@components/UserLists/ListCard';

type FeaturedListsGridProps = {
  lists: UserList[];
  utmContent?: string;
  isSmall?: boolean;
};

export function FeaturedListsGrid(props: FeaturedListsGridProps) {
  const { lists, utmContent = 'featured-lists', isSmall } = props;

  return (
    <Flex flexWrap="wrap" gap={4} justifyContent="center" w="100%" minW={0}>
      {lists.map((list) => (
        <UserListCard
          key={list.internal_id}
          list={list}
          utm_content={utmContent}
          isSmall={isSmall}
        />
      ))}
    </Flex>
  );
}
