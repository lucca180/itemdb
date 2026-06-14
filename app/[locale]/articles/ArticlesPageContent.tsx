import { Flex, Heading } from '@chakra-ui/react';
import HeaderCard from '@components/Card/HeaderCard';
import type { WP_Article } from '@types';
import { ArticleSection } from './ArticleSection';
import type { ArticlesPageLabels } from './buildArticlesPageProps';

type ArticlesPageContentProps = {
  labels: ArticlesPageLabels;
  groupedPosts: Record<string, WP_Article[]>;
};
export function ArticlesPageContent({ labels, groupedPosts }: ArticlesPageContentProps) {
  return (
    <>
      <HeaderCard
        image={{
          src: 'https://images.neopets.com/nt/ntimages/94_acara_type.gif',
          alt: 'rainbow pets',
        }}
        color="#E4DA0A"
      >
        <Heading size="lg" as="h1">
          {labels.title}
        </Heading>
      </HeaderCard>
      <Flex flexFlow="column" gap={3}>
        {Object.entries(groupedPosts).map(([category, posts]) => (
          <ArticleSection
            key={category}
            title={category}
            articles={posts}
            limit={6}
            showMoreLabel={labels.showMore}
            showLessLabel={labels.showLess}
          />
        ))}
      </Flex>
    </>
  );
}
