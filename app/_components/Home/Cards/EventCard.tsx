import { Suspense } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import { getTrendingCatLists } from '@pages/api/v1/beta/trending';
import { CupCard } from '@components/Card/EventCard';

async function getCachedEventLists(category: string, limit: number) {
  'use cache';
  cacheTag('home-event-card-lists');
  cacheLife('homeSlow');
  return getTrendingCatLists(category, limit).catch(() => []);
}

export function CupHomeCard() {
  return (
    <Suspense fallback={<EventHomeCard />}>
      <EventHomeCard category="Altador Cup 2026" />
    </Suspense>
  );
}

async function EventHomeCard({ category, limit }: { category?: string; limit?: number }) {
  if (!category) return <CupCard />;
  const lists = await getCachedEventLists(category, limit ?? 3);

  if (!lists.length) return null;

  return <CupCard lists={lists} />;
}
