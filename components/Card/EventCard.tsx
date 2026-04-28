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
      utm_content="event-lists"
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
          <UserListCard utm_content="event-lists" isSmall list={list} key={list.internal_id} />
        ))}
      </Flex>
    </HorizontalHomeCard>
  );
};

export const TVWHomeCard = (props: EventCardProps) => {
  const { lists } = props;
  return (
    <HorizontalHomeCard
      color="#5436ab"
      h={50}
      w={50}
      image="https://images.neopets.com/plots/tvw/activities/void-collection/images/void-attractor.png"
      viewAllLink="/hub/the-void-within"
      title={'The Void Within'}
      isSmall
      utm_content="tvw-lists"
      sx={{
        position: 'relative',
        isolation: 'isolate',
        overflow: 'hidden',
        img: {
          filter: 'drop-shadow(0 0 5px #f3a4ff)',
        },
        h2: {
          textShadow: '0 0 10px #f3a4ff',
        },
        '::before': {
          content: "''",
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage:
            "url('https://images.neopets.com/plots/tvw/home/images/void-pattern.png')",
          opacity: 0.5,
          zIndex: -1,
        },
      }}
      innerStyle={{
        border: '2px solid #f3a4ff7d',
      }}
    >
      <Flex flexWrap="wrap" gap={4} justifyContent="center">
        {lists.map((list) => (
          <UserListCard utm_content="event-lists" isSmall list={list} key={list.internal_id} />
        ))}
      </Flex>
    </HorizontalHomeCard>
  );
};
