import { Suspense } from 'react';
import MainLink from '@components/Utils/MainLink';
import { Flex, Heading, Skeleton } from '@chakra-ui/react';
import { wp_getLatestPosts } from '../../../../pages/api/wp/posts';
import { cacheLife, cacheTag } from 'next/cache';
import { LatestArticleCard } from '@app/_components/Home/Sections/LatestArticleCard';
import type { WP_Article } from '@types';

type LatestArticlesSectionProps = {
  title: string;
  limit?: number;
};

type CachedArticle = {
  article: WP_Article;
  isNew: boolean;
};

async function getCachedLatestArticles(limit: number): Promise<CachedArticle[]> {
  'use cache';
  cacheTag('home-latest-articles');
  cacheLife('homeFast');
  const posts = await wp_getLatestPosts(limit).catch(() => []);
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return posts.map((article) => ({
    article,
    isNew: new Date(article.date).getTime() > cutoff,
  }));
}

export function LatestArticlesSection({ title, limit = 5 }: LatestArticlesSectionProps) {
  return (
    <Suspense fallback={<LatestArticlesSectionFallback title={title} limit={limit} />}>
      <LatestArticlesSectionContent title={title} limit={limit} />
    </Suspense>
  );
}

function LatestArticlesSectionFallback({ title, limit }: { title: string; limit: number }) {
  return (
    <Flex flex={1} direction="column">
      <Heading as="h2" size="md" lineHeight="1.2" textAlign="center" mb={5}>
        <MainLink href="/articles">{title}</MainLink>
      </Heading>
      <Flex direction="column" gap={2}>
        {Array.from({ length: limit }, (_, index) => (
          <Flex
            key={index}
            p={3}
            gap={3}
            w="100%"
            alignItems="center"
            borderRadius="md"
            bg="whiteAlpha.100"
          >
            <Skeleton w="60px" h="60px" borderRadius="md" flexShrink={0} />
            <Flex direction="column" gap={2} flex={1}>
              <Skeleton h="4" w="80%" />
              <Skeleton h="3" w="full" />
            </Flex>
          </Flex>
        ))}
      </Flex>
    </Flex>
  );
}

async function LatestArticlesSectionContent({ title, limit = 5 }: LatestArticlesSectionProps) {
  const articles = await getCachedLatestArticles(limit);

  return (
    <Flex flex={1} direction="column">
      <Heading as="h2" size="md" lineHeight="1.2" textAlign="center" mb={5}>
        <MainLink href="/articles">{title}</MainLink>
      </Heading>
      <Flex direction="column" gap={2}>
        {articles.map(({ article, isNew }) => (
          <LatestArticleCard key={article.id} article={article} isNew={isNew} />
        ))}
      </Flex>
    </Flex>
  );
}
