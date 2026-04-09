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
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from '@chakra-ui/react';
import { GetStaticPropsContext } from 'next';
import HeaderCard from '../../components/Card/HeaderCard';
import Layout from '../../components/Layout';
import { WP_Article } from '../../types';
import { wp_getBySlug } from '../api/wp/posts/[slug]';
import parse, { HTMLReactParserOptions, Element, domToReact, DOMNode } from 'html-react-parser';
import { wp_getLatestPosts } from '../api/wp/posts';
import { ArticleCard } from '../../components/Articles/ArticlesCard';
import { useFormatter, useTranslations } from 'next-intl';
import { ReactElement } from 'react';
import { ArticleBreadcrumb } from '../../components/Breadcrumbs/ArticlesBreadcrumb';
import { loadTranslation } from '@utils/load-translation';
import { processShortcodes } from '@utils/shortcodes';
import Color from 'color';

export type ArticlePageProps = {
  post: WP_Article;
  recommendations: WP_Article[];
  messages: any;
  locale: string;
};

const ArticlePage = (props: ArticlePageProps) => {
  const t = useTranslations();
  const formatter = useFormatter();
  const { post, recommendations } = props;

  const color = Color(post.palette?.vibrant.hex ?? '#05B7E8');

  return (
    <>
      <HeaderCard
        image={
          post.thumbnail
            ? {
                src: post.thumbnail,
                alt: 'post thumbnail',
              }
            : undefined
        }
        color={color.lightness(55).hex()}
        breadcrumb={<ArticleBreadcrumb article={post} />}
        isCenter
      >
        <Heading size="lg" as="h1" textAlign="center">
          {parse(post.title)}
        </Heading>
        <Text
          size={{ base: 'sm', md: undefined }}
          as="h2"
          textAlign="center"
          maxW={'900px'}
          mx="auto"
        >
          {post.excerpt}
        </Text>
        <Text fontSize="xs" mt={1} textAlign="center">
          {t('Articles.posted-at-date', {
            date: formatter.dateTime(new Date(post.date), {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
          })}{' '}
          -{' '}
          {t('Articles.updated-x', {
            x: formatter.relativeTime(new Date(post.updated)),
          })}
        </Text>
      </HeaderCard>
      <Flex
        flexFlow="column"
        gap={3}
        sx={{
          a: { color: color.lightness(65).hex() ?? 'cyan.300' },
          'b,strong': {
            color: Color(post.palette?.lightvibrant.hex).lightness(60).hex() ?? 'blue.300',
          },
          img: { my: 2 },
        }}
      >
        <Flex flexFlow="column" gap={3} px={3} maxW={'900px'} w="100%" fontSize={'md'} mx={'auto'}>
          {parse(processShortcodes(post.content), options)}
        </Flex>
      </Flex>
      {recommendations.length > 0 && (
        <Flex
          flexFlow={'column'}
          justifyContent={'center'}
          maxW={'900px'}
          mx={'auto'}
          px={3}
          my={16}
        >
          <Heading size="md" as="h3" my={2}>
            {t('Articles.recommended-articles')}
          </Heading>
          <Flex gap={[2, 3]} overflow="auto" pb={3}>
            {recommendations.slice(0, 3).map((article) => (
              <ArticleCard key={article.id} article={article} vertical />
            ))}
          </Flex>
        </Flex>
      )}
    </>
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
      messages: await loadTranslation(context.locale as string, 'articles/[slug]'),
      recommendations: recommended.filter((x) => x.id !== post.id),
      locale: context.locale,
    },
    revalidate: 60,
  };
}

ArticlePage.getLayout = function getLayout(page: ReactElement, props: ArticlePageProps) {
  const { post } = props;
  return (
    <Layout
      SEO={{
        title: post.title,
        description: post.excerpt,
        themeColor: post.palette?.vibrant.hex ?? '#05B7E8',
        openGraph: {
          images: [{ url: post.thumbnail ?? '', width: 150, height: 150, alt: post.title }],
        },
      }}
      mainColor={`${post.palette?.vibrant.hex ?? '#05B7E8'}6b`}
    >
      {page}
    </Layout>
  );
};

export async function getStaticPaths() {
  return {
    paths: [],
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
      return (
        <Td
          whiteSpace={'normal'}
          textAlign={'center'}
          fontSize={'sm'}
          sx={{ img: { display: 'inline-block' } }}
        >
          {domToReact(children, options)}
        </Td>
      );

    if (domChildren instanceof Element && domChildren.name === 'code')
      return <Code>{domToReact(children, options)}</Code>;

    if (domChildren instanceof Element && domChildren.name === 'sc-alert') {
      const status = (domChildren.attribs.status ?? 'info') as
        | 'info'
        | 'warning'
        | 'success'
        | 'error';

      const title = domChildren.attribs.title ?? '';

      return (
        <Alert
          status={status}
          display={'flex'}
          flexFlow={'column'}
          alignItems={'flex-start'}
          borderRadius={'md'}
        >
          <Flex mb={1}>
            <AlertIcon />
            {title && <AlertTitle>{title}</AlertTitle>}
          </Flex>
          <AlertDescription display={'flex'} flexFlow={'column'} gap={2} fontSize={'sm'}>
            {domToReact(children, options)}
          </AlertDescription>
        </Alert>
      );
    }
  },
};
