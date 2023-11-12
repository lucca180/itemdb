import { Flex, Heading, Image, Text, Link, Card, CardBody, Stack } from '@chakra-ui/react';
import { WP_Article } from '../../types';
import NextLink from 'next/link';

type Props = {
  article: WP_Article;
  vertical?: boolean;
};

export const ArticleCard = (props: Props) => {
  const { article, vertical } = props;
  const rgb = article.palette?.lightvibrant.rgb ?? [0, 0, 0];

  if (vertical)
    return (
      <Link
        // flex={1}
        as={NextLink}
        href={`/articles/${article.slug}`}
        borderRadius="md"
        _hover={{
          textDecoration: 'none',
          bg: `rgba(${rgb[0]},${rgb[1]}, ${rgb[2]},.5)`,
        }}
      >
        <Card
          w={['150px', '200px']}
          h="100%"
          maxH="300px"
          bg={`rgba(${rgb[0]},${rgb[1]}, ${rgb[2]},.3)`}
        >
          <CardBody>
            <Image
              maxH={'125px'}
              src={article.thumbnail ?? '/logo.png'}
              alt={article.title}
              borderRadius="lg"
            />
            <Stack mt={['2', '3']} spacing={['1', '3']}>
              <Heading size="sm" noOfLines={3}>
                {article.title}
              </Heading>
              <Text fontSize="xs" noOfLines={3}>
                {article.excerpt}
              </Text>
            </Stack>
          </CardBody>
        </Card>
      </Link>
    );

  return (
    <Link
      as={NextLink}
      display="flex"
      href={`/articles/${article.slug}`}
      p={3}
      gap={3}
      // maxW="500px"
      w="100%"
      alignItems="center"
      borderRadius="md"
      bg={`rgba(${rgb[0]},${rgb[1]}, ${rgb[2]},.15)`}
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
