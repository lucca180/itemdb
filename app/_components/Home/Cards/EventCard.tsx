import { unstable_cache } from 'next/cache';
import { getTrendingCatLists } from '@pages/api/v1/beta/trending';
import { TVWHomeCard as TVWClientCard } from '@components/Card/EventCard';

const getCachedEventLists = unstable_cache(
  async (category: string, limit: number) => getTrendingCatLists(category, limit).catch(() => []),
  ['home-event-card-lists'],
  {
    tags: ['home-event-card-lists'],
    revalidate: 3600,
  }
);

export function TVWHomeCard() {
  return <EventHomeCard category="The Void Within" />;
}

async function EventHomeCard({ category, limit }: { category: string; limit?: number }) {
  const lists = await getCachedEventLists(category, limit ?? 3);

  if (!lists.length) return null;

  return <TVWClientCard lists={lists} />;
}
