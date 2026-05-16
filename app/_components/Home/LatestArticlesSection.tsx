import { Badge, Card, CardBody, Flex, Heading, HStack, Stack, Text } from '@chakra-ui/react';
import NextLink from 'next/link';
import NextImage from 'next/image';
import type { WP_Article } from '@types';

type LatestArticlesSectionProps = {
  articles: WP_Article[];
  title: string;
};

export function LatestArticlesSection({ articles, title }: LatestArticlesSectionProps) {
  return (
    <Flex flex={1} flexFlow="column">
      <Heading size="md" textAlign="center" mb={5}>
        <NextLink href="/articles">{title}</NextLink>
      </Heading>
      <Flex flexFlow="column" gap={2}>
        {articles.map((post) => (
          <LatestArticleCard key={post.id} article={post} />
        ))}
      </Flex>
    </Flex>
  );
}

function LatestArticleCard({ article }: { article: WP_Article }) {
  const rgb = article.palette?.lightvibrant.rgb ?? [0, 0, 0];
  const isNew = new Date(article.date) > new Date(new Date().setDate(new Date().getDate() - 7));

  return (
    <NextLink prefetch={false} href={`/articles/${article.slug}`}>
      <Flex
        p={3}
        gap={3}
        w="100%"
        alignItems="center"
        borderRadius="md"
        bg={`rgba(${rgb[0]},${rgb[1]}, ${rgb[2]},.15)`}
        _hover={{
          textDecoration: 'none',
          bg: `rgba(${rgb[0]},${rgb[1]}, ${rgb[2]},.5)`,
        }}
      >
        <Card bg="transparent" boxShadow="none">
          <CardBody p={0}>
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
          </CardBody>
        </Card>
        <Stack gap={1}>
          <HStack>
            {isNew && <Badge colorScheme="yellow">New</Badge>}
            <Heading size="md">{article.title}</Heading>
          </HStack>
          <Text fontSize="xs">{article.excerpt}</Text>
        </Stack>
      </Flex>
    </NextLink>
  );
}
