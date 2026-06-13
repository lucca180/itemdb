'use client';

import { Button, Flex, Heading } from '@chakra-ui/react';
import { ArticleCard } from '@components/Articles/ArticlesCard';
import type { WP_Article } from '@types';
import { useState } from 'react';

type ArticleSectionProps = {
  title: string;
  articles: WP_Article[];
  limit?: number;
  showMoreLabel: string;
  showLessLabel: string;
};

export function ArticleSection({
  title,
  articles,
  limit,
  showMoreLabel,
  showLessLabel,
}: ArticleSectionProps) {
  const [showMore, setShowMore] = useState(false);
  const displayedArticles = showMore ? articles : articles.slice(0, limit || Infinity);

  return (
    <Flex
      bg="blackAlpha.500"
      gap={3}
      flexFlow="column"
      flexWrap="wrap"
      justifyContent="center"
      p={5}
      borderRadius="md"
    >
      <Heading size="md">{title}</Heading>

      <Flex gap={3} flexWrap="wrap" justifyContent="center">
        {displayedArticles.map((article) => (
          <ArticleCard vertical key={article.id} article={article} />
        ))}
      </Flex>

      {articles.length > (limit || Infinity) && (
        <Button onClick={() => setShowMore((prev) => !prev)} alignSelf="center" mt={3} size="sm">
          {showMore ? showLessLabel : showMoreLabel}
        </Button>
      )}
    </Flex>
  );
}
