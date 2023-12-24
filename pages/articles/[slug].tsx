/* eslint-disable react/no-unescaped-entities */
import {
  Flex,
  Heading,
  Text,
  Link,
  ListItem,
  UnorderedList,
  Table,
  TableContainer,
  Td,
  Tr,
  Tbody,
  Code,
} from '@chakra-ui/react';
import { GetStaticPropsContext } from 'next';
import HeaderCard from '../../components/Card/HeaderCard';
import Layout from '../../components/Layout';
import { WP_Article } from '../../types';
import { wp_getBySlug } from '../api/wp/posts/[slug]';
import parse, { HTMLReactParserOptions, Element, domToReact, DOMNode } from 'html-react-parser';
import NextLink from 'next/link';
import { wp_getLatestPosts } from '../api/wp/posts';
import { ArticleCard } from '../../components/Articles/ArticlesCard';

type Props = {
  post: WP_Article;
  recomendations: WP_Article[];
};

const ArticlePage = (props: Props) => {
  const { post, recomendations } = props;
  return (
    <Layout
      SEO={{
        title: post.title,
        description: post.excerpt,
        themeColor: post.palette?.lightvibrant.hex ?? '#05B7E8',
        openGraph: {
          images: [{ url: post.thumbnail ?? '', width: 150, height: 150, alt: post.title }],
        },
      }}
    >
      <HeaderCard
        image={
          post.thumbnail
            ? {
                src: post.thumbnail,
                alt: 'rainbow pets',
              }
            : undefined
        }
        color={post.palette?.lightvibrant.hex ?? '#05B7E8'}
      >
        <Text fontSize="xs">
          <Link as={NextLink} href="/articles">
            Articles
          </Link>
        </Text>
        <Heading size="lg" as="h1">
          {parse(post.title)}
        </Heading>
        <Text size={{ base: 'sm', md: undefined }} as="h2">
          {post.excerpt}
        </Text>
      </HeaderCard>
      <Flex
        flexFlow="column"
        gap={3}
        sx={{
          a: { color: post.palette?.vibrant.hex ?? 'cyan.300' },
          'b,strong': { color: post.palette?.lightvibrant.hex ?? 'blue.300' },
          img: { my: 2 },
        }}
      >
        <Flex flexFlow="column" gap={3} px={3} maxW={1000}>
          {parse(post.content, options)}
        </Flex>
      </Flex>
      {recomendations.length > 0 && (
        <>
          <Heading size="md" as="h3" my={2} mt={16}>
            Recommended Articles
          </Heading>
          <Flex gap={[2, 3]} overflow="auto" pb={3}>
            {recomendations.slice(0, 3).map((article) => (
              <ArticleCard key={article.id} article={article} vertical />
            ))}
          </Flex>
        </>
      )}
    </Layout>
  );
};

export default ArticlePage;

export async function getStaticProps(context: GetStaticPropsContext) {
  const slug = context?.params?.slug as string;

  if (!slug) return { notFound: true };

  const post = await wp_getBySlug(slug);
  if (!post) return { notFound: true };

  let recommended = await wp_getLatestPosts(100, 1, true);
  //shuffle
  const Chance = (await import('chance')).default;
  const chance = new Chance();
  recommended = chance.shuffle(recommended);

  return {
    props: {
      post,
      recomendations: recommended.filter((x) => x.id !== post.id),
    },
    revalidate: 60,
  };
}

export async function getStaticPaths() {
  const posts = await wp_getLatestPosts(100);

  return {
    paths: posts.map((post) => ({ params: { slug: post.slug } })),
    fallback: 'blocking',
  };
}

const options: HTMLReactParserOptions = {
  replace: (domChildren) => {
    // @ts-expect-error https://github.com/remarkablemark/html-react-parser
    const children = domChildren.children as DOMNode[];

    if (domChildren instanceof Element && domChildren.name === 'h2')
      return (
        <Heading size="lg" as="h2" my={3}>
          {domToReact(children, options)}
        </Heading>
      );

    if (domChildren instanceof Element && domChildren.name === 'h3')
      return (
        <Heading size="md" as="h3" my={2}>
          {domToReact(children, options)}
        </Heading>
      );

    if (domChildren instanceof Element && domChildren.name === 'h4')
      return (
        <Heading size="sm" as="h4" my={2}>
          {domToReact(children, options)}
        </Heading>
      );

    if (domChildren instanceof Element && domChildren.name === 'a')
      return (
        <Link href={domChildren.attribs.href} isExternal={domChildren.attribs.target === '_blank'}>
          {domToReact(children, options)}
        </Link>
      );

    if (domChildren instanceof Element && domChildren.name === 'ul')
      return <UnorderedList spacing={1}>{domToReact(children, options)}</UnorderedList>;

    if (domChildren instanceof Element && domChildren.name === 'li')
      return <ListItem>{domToReact(children, options)}</ListItem>;

    if (domChildren instanceof Element && domChildren.name === 'table')
      return (
        <TableContainer my={3} border="1px solid rgba(255,255,255,0.3)" borderRadius={'sm'}>
          <Table variant="striped">{domToReact(children, options)}</Table>
        </TableContainer>
      );

    if (domChildren instanceof Element && domChildren.name === 'tbody')
      return <Tbody>{domToReact(children, options)}</Tbody>;

    if (domChildren instanceof Element && domChildren.name === 'tr')
      return <Tr>{domToReact(children, options)}</Tr>;

    if (domChildren instanceof Element && domChildren.name === 'td')
      return <Td whiteSpace={'normal'}>{domToReact(children, options)}</Td>;

    if (domChildren instanceof Element && domChildren.name === 'code')
      return <Code>{domToReact(children, options)}</Code>;
  },
};
