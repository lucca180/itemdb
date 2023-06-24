/* eslint-disable react/no-unescaped-entities */
import { Flex, Heading, Text, Link, ListItem, UnorderedList } from '@chakra-ui/react';
import { GetStaticPropsContext } from 'next';
import HeaderCard from '../../components/Card/HeaderCard';
import Layout from '../../components/Layout';
import { WP_Article } from '../../types';
import { wp_getBySlug } from '../api/wp/posts/[slug]';
import parse, { HTMLReactParserOptions, Element, domToReact } from 'html-react-parser';
import NextLink from 'next/link';
type Props = {
  post: WP_Article;
};

const ArticlePage = (props: Props) => {
  const { post } = props;
  return (
    <Layout
      SEO={{
        title: post.title,
        description: post.excerpt,
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
        color={post.palette?.vibrant.hex ?? '#05B7E8'}
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
          a: { color: post.palette?.lightvibrant.hex ?? 'cyan.300' },
          'b,strong': { color: post.palette?.vibrant.hex ?? 'blue.300' },
        }}
      >
        <Flex flexFlow="column" gap={3} px={3} maxW={1000}>
          {parse(post.content, options)}
        </Flex>
      </Flex>
    </Layout>
  );
};

export default ArticlePage;

export async function getStaticProps(context: GetStaticPropsContext) {
  const slug = context?.params?.slug as string;

  if (!slug) return { notFound: true };

  const post = await wp_getBySlug(slug);
  if (!post) return { notFound: true };

  return {
    props: {
      post,
    },
    revalidate: 60,
  };
}

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: 'blocking',
  };
}

const options: HTMLReactParserOptions = {
  replace: (domNode) => {
    if (domNode instanceof Element && domNode.name === 'h3')
      return (
        <Heading size="md" as="h3">
          {domToReact(domNode.children, options)}
        </Heading>
      );

    if (domNode instanceof Element && domNode.name === 'a')
      return (
        <Link href={domNode.attribs.href} isExternal={domNode.attribs.target === '_blank'}>
          {domToReact(domNode.children, options)}
        </Link>
      );

    if (domNode instanceof Element && domNode.name === 'ul')
      return <UnorderedList>{domToReact(domNode.children, options)}</UnorderedList>;

    if (domNode instanceof Element && domNode.name === 'li')
      return <ListItem>{domToReact(domNode.children, options)}</ListItem>;
  },
};
