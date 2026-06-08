'use client';

import MainLink from '@components/Utils/MainLink';
import NextImage from 'next/image';
import type { CSSProperties } from 'react';
import type { WP_Article } from '@types';
import { Box, Flex, Heading, Text } from '@chakra-ui/react';

type LatestArticleCardProps = {
  article: WP_Article;
  isNew: boolean;
};

export function LatestArticleCard({ article, isNew }: LatestArticleCardProps) {
  const rgb = article.palette?.lightvibrant.rgb ?? [0, 0, 0];
  const baseBackground = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.15)`;
  const hoverBackground = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.5)`;

  const cardStyle = {
    '--article-card-bg': baseBackground,
    '--article-card-hover-bg': hoverBackground,
  } as CSSProperties;

  return (
    <MainLink prefetch={false} href={`/articles/${article.slug}`}>
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
            <Heading as="h3" size="md" lineHeight="1.2">
              {article.title}
            </Heading>
          </Flex>
          <Text fontSize="xs">{article.excerpt}</Text>
        </Flex>
      </Flex>
    </MainLink>
  );
}
