import { Flex, Heading, Image, Text, Link } from '@chakra-ui/react';
import { WP_Article } from '../../types';
import NextLink from 'next/link';

type Props = {
  article: WP_Article;
};

export const ArticleCard = (props: Props) => {
  const { article } = props;
  const rgb = article.palette?.vibrant.rgb ?? [0, 0, 0];
  return (
    <Link
      as={NextLink}
      display="flex"
      href={`/articles/${article.slug}`}
      bg={'gray.700'}
      p={3}
      gap={3}
      // maxW="500px"
      w="100%"
      alignItems="center"
      borderRadius="md"
      _hover={{
        textDecoration: 'none',
        bg: `rgba(${rgb[0]},${rgb[1]}, ${rgb[2]},.5)`,
      }}
    >
      <Image
        src={article.thumbnail ?? '/logo.png'}
        alt="article thumbnail"
        width="60px"
        height="60px"
        borderRadius="md"
      />
      <Flex flexFlow={'column'} gap={1}>
        <Heading size="md">{article.title}</Heading>
        <Text fontSize="xs">{article.excerpt}</Text>
      </Flex>
    </Link>
  );
};
