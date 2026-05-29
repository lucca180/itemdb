import { Suspense } from 'react';
import { Flex } from '@chakra-ui/react';
import { unstable_cache } from 'next/cache';
import { getTrendingCatLists } from '@pages/api/v1/beta/trending';
import { HorizontalHomeCard } from '@components/Card/HorizontalHomeCard';
import { TVWHomeCard as TVWClientCard } from '@components/Card/EventCard';

const getCachedEventLists = unstable_cache(
  async (category: string, limit: number) => getTrendingCatLists(category, limit).catch(() => []),
  ['home-event-card-lists'],
  {
    tags: ['home-event-card-lists'],
    revalidate: 3600,
  }
);

const tvwCardStyle = {
  position: 'relative',
  isolation: 'isolate',
  overflow: 'hidden',
  '& img': {
    filter: 'drop-shadow(0 0 5px #f3a4ff)',
  },
  '& h2': {
    textShadow: '0 0 10px #f3a4ff',
  },
  '&::before': {
    content: "''",
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage: "url('https://images.neopets.com/plots/tvw/home/images/void-pattern.png')",
    opacity: 0.5,
    zIndex: -1,
  },
} as const;

export function TVWHomeCard() {
  return (
    <Suspense fallback={<TVWHomeCardFallback />}>
      <EventHomeCard category="The Void Within" />
    </Suspense>
  );
}

function TVWHomeCardFallback() {
  return (
    <HorizontalHomeCard
      color="#5436ab"
      h={50}
      w={50}
      image="https://images.neopets.com/plots/tvw/activities/void-collection/images/void-attractor.png"
      viewAllLink="/hub/the-void-within"
      title="The Void Within"
      isSmall
      utm_content="tvw-lists"
      css={tvwCardStyle}
      innerStyle={{
        border: '2px solid #f3a4ff7d',
      }}
    >
      <Flex flexWrap="wrap" gap={4} justifyContent="center" minH="120px" />
    </HorizontalHomeCard>
  );
}

async function EventHomeCard({ category, limit }: { category: string; limit?: number }) {
  const lists = await getCachedEventLists(category, limit ?? 3);

  if (!lists.length) return null;

  return <TVWClientCard lists={lists} />;
}
