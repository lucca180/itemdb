import NextLink from 'next/link';
import NextImage from 'next/image';
import type { CSSProperties } from 'react';
import type { WP_Article } from '@types';
import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import { wp_getLatestPosts } from '../../../../pages/api/wp/posts';
import { unstable_cache } from 'next/cache';

type LatestArticlesSectionProps = {
  title: string;
  limit?: number;
};

const getCachedLatestArticles = unstable_cache(
  async (limit: number) => wp_getLatestPosts(limit).catch(() => []),
  ['home-articles', 'latest-articles'],
  {
    tags: ['home-latest-articles'],
    revalidate: 180,
  }
);

export async function LatestArticlesSection({ title, limit = 5 }: LatestArticlesSectionProps) {
  const articles = await getCachedLatestArticles(limit);

  return (
    <Flex flex={1} direction="column">
      <Heading as="h2" size="xl" lineHeight="1.2" textAlign="center" mb={5}>
        <NextLink href="/articles">{title}</NextLink>
      </Heading>
      <Flex direction="column" gap={2}>
        {articles.map((post) => (
          <LatestArticleCard key={post.id} article={post} />
        ))}
      </Flex>
    </Flex>
  );
}

function LatestArticleCard({ article }: { article: WP_Article }) {
  const rgb = article.palette?.lightvibrant.rgb ?? [0, 0, 0];
  const baseBackground = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.15)`;
  const hoverBackground = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.5)`;

  const isNew = new Date(article.date) > new Date(new Date().setDate(new Date().getDate() - 7));

  const cardStyle = {
    '--article-card-bg': baseBackground,
    '--article-card-hover-bg': hoverBackground,
  } as CSSProperties;

  return (
    <NextLink prefetch={false} href={`/articles/${article.slug}`}>
      <Flex
        p={3}
        gap={3}
        w="100%"
        alignItems="center"
        borderRadius="md"
        bg="var(--article-card-bg)"
        style={cardStyle}
        _hover={{
          textDecoration: 'none',
          bg: 'var(--article-card-hover-bg)',
        }}
      >
        <Box p={0} flexShrink={0}>
          <NextImage
            src={article.thumbnail ?? '/logo.png'}
            alt="article thumbnail"
            quality={100}
            width={150}
            height={150}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '0.375rem',
              objectFit: 'cover',
            }}
          />
        </Box>
        <Flex flexDirection="column" gap={1}>
          <Flex alignItems="center" gap={2}>
            {isNew && (
              <Box
                as="span"
                display="inline-flex"
                alignItems="center"
                px={1}
                minH={5}
                borderRadius="xs"
                bg="yellow.200/20"
                color="yellow.200"
                fontSize="xs"
                fontWeight="bold"
                textTransform="uppercase"
              >
                New
              </Box>
            )}
            <Heading as="h3" size="xl" lineHeight="1.2">
              {article.title}
            </Heading>
          </Flex>
          <Text fontSize="xs">{article.excerpt}</Text>
        </Flex>
      </Flex>
    </NextLink>
  );
}
