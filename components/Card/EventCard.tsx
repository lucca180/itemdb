import { useTranslations } from 'next-intl';
import { HorizontalHomeCard } from './HorizontalHomeCard';
import { UserList } from '@types';
import { Flex } from '@chakra-ui/react';
import UserListCard from '@components/UserLists/ListCard';

type EventCardProps = {
  lists: UserList[];
};

export const NeggsCard = (props: EventCardProps) => {
  const { lists } = props;
  const t = useTranslations();

  return (
    <HorizontalHomeCard
      color="#54b464"
      h={50}
      w={50}
      image="https://images.neopets.com/neggfest/2011/hunt/byn7hd/blue.png"
      viewAllLink="/lists/official?cat=Festival%20of%20Neggs%202026"
      title={'Festival of Neggs 2026'}
      isSmall
      utm_content="neopies-lists"
      viewAllText={t('General.view-all')}
      sx={{
        position: 'relative',
        isolation: 'isolate',
        overflow: 'hidden',
        '.card-icon': {
          filter: 'drop-shadow(0 0 5px rgb(70, 221, 120))',
        },
        '::before': {
          content: "''",
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: "url('https://images.neopets.com/neggfest/y27/np/bg.jpg')",
          backgroundSize: 'contain',
          backgroundPosition: 'top center',
          opacity: 0.5,
          filter: 'blur(5px) brightness(0.5)',
          zIndex: -1,
        },
      }}
      innerStyle={{
        border: '2px solid #4c9b42',
      }}
    >
      <Flex flexWrap="wrap" gap={4} justifyContent="center">
        {lists.map((list) => (
          <UserListCard isSmall list={list} key={list.internal_id} />
        ))}
      </Flex>
    </HorizontalHomeCard>
  );
};
