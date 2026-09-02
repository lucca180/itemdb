'use client';

import { Flex, Heading, Text, Link, Card, Stack, HStack, Badge } from '@chakra-ui/react';
import { useFormatter } from 'next-intl';
import type { WP_Article } from '@types';
import MainLink from '@components/Utils/MainLink';
import Image from '@components/Utils/Image';
import { toIso8601Utc } from '@utils/isoDate';

type Props = {
  article: WP_Article;
  vertical?: boolean;
};

function ArticlePublishTime({ date }: { date: string }) {
  const formatter = useFormatter();
  const publishedIso = toIso8601Utc(date);
  if (!publishedIso) return null;

  return (
    <Text fontSize="xs" color="whiteAlpha.700" mt="auto" flexShrink={0}>
      <time dateTime={publishedIso}>
        {formatter.dateTime(new Date(publishedIso), {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}
      </time>
    </Text>
  );
}

export const ArticleCard = (props: Props) => {
  const { article, vertical } = props;
  const rgb = article.palette?.lightvibrant.rgb ?? [0, 0, 0];

  const isNew = new Date(article.date) > new Date(new Date().setDate(new Date().getDate() - 7));

  if (vertical)
    return (
      <Link
        asChild
        display="flex"
        alignSelf="stretch"
        borderRadius="md"
        _hover={{
          textDecoration: 'none',
          bg: `rgba(${rgb[0]},${rgb[1]}, ${rgb[2]},.5)`,
        }}
      >
        <MainLink viaNextLink prefetch={false} href={`/articles/${article.slug}`}>
          <Card.Root
            w={['150px', '200px']}
            h="100%"
            overflow="visible"
            display="flex"
            flexDirection="column"
            bg={`rgba(${rgb[0]},${rgb[1]}, ${rgb[2]},.3)`}
          >
            <Card.Body overflow="visible" display="flex" flexDirection="column" flex="1">
              <Image
                width={150}
                height={150}
                w="125px"
                maxH={'125px'}
                flexShrink={0}
                src={article.thumbnail ?? '/logo.png'}
                alt={article.title}
                borderRadius="lg"
              />
              <Stack mt={['2', '3']} gap={['1', '3']} flex="1">
                <Heading size="sm" lineClamp={3}>
                  {article.title}
                </Heading>
                <Text fontSize="xs" lineClamp={3}>
                  {article.excerpt}
                </Text>
                <ArticlePublishTime date={article.date} />
              </Stack>
            </Card.Body>
          </Card.Root>
        </MainLink>
      </Link>
    );

  return (
    <Link
      asChild
      display="flex"
      p={3}
      gap={3}
      w="100%"
      alignItems="center"
      borderRadius="md"
      bg={`rgba(${rgb[0]},${rgb[1]}, ${rgb[2]},0.15)`}
      _hover={{
        textDecoration: 'none',
        bg: `rgba(${rgb[0]},${rgb[1]}, ${rgb[2]},0.5)`,
      }}
    >
      <MainLink viaNextLink prefetch={false} href={`/articles/${article.slug}`}>
        <Image
          src={article.thumbnail ?? '/logo.png'}
          alt="article thumbnail"
          quality={100}
          width={150}
          height={150}
          w="60px"
          h="60px"
          borderRadius="md"
        />
        <Flex flexFlow={'column'} gap={1}>
          <HStack>
            {isNew && <Badge colorPalette="yellow">New</Badge>}
            <Heading size="md">{article.title}</Heading>
          </HStack>
          <Text fontSize="xs">{article.excerpt}</Text>
          <ArticlePublishTime date={article.date} />
        </Flex>
      </MainLink>
    </Link>
  );
};
