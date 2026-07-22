import { Alert, Box, Code, Flex, Heading, Link, List, Table, Text } from '@chakra-ui/react';
import { ArticleCard } from '@components/Articles/ArticlesCard';
import { BreadcrumbsView } from '@components/Breadcrumbs/BreadcrumbsView';
import HeaderCard from '@components/Card/HeaderCard';
import { processShortcodes } from '@utils/shortcodes';
import Color from 'color';
import parse, {
  domToReact,
  Element,
  type DOMNode,
  type HTMLReactParserOptions,
} from 'html-react-parser';
import type { WP_Article } from '@types';
import type { ArticlePageLabels } from './buildArticlePageProps';

const articleParserOptions: HTMLReactParserOptions = {
  replace: (domChildren) => {
    // @ts-expect-error https://github.com/remarkablemark/html-react-parser
    const children = domChildren.children as DOMNode[];

    if (domChildren instanceof Element && domChildren.name === 'h2')
      return (
        <Heading size="lg" as="h2" my={3}>
          {domToReact(children, articleParserOptions)}
        </Heading>
      );

    if (domChildren instanceof Element && domChildren.name === 'h3')
      return (
        <Heading size="md" as="h3" my={2}>
          {domToReact(children, articleParserOptions)}
        </Heading>
      );

    if (domChildren instanceof Element && domChildren.name === 'h4')
      return (
        <Heading size="sm" as="h4" my={2}>
          {domToReact(children, articleParserOptions)}
        </Heading>
      );

    if (domChildren instanceof Element && domChildren.name === 'a')
      return (
        <Link
          href={domChildren.attribs.href}
          target={domChildren.attribs.target === '_blank' ? '_blank' : undefined}
          rel={domChildren.attribs.target === '_blank' ? 'noreferrer' : undefined}
        >
          {domToReact(children, articleParserOptions)}
        </Link>
      );

    if (domChildren instanceof Element && domChildren.name === 'ul')
      return (
        <List.Root as="ul" gap={1}>
          {domToReact(children, articleParserOptions)}
        </List.Root>
      );

    if (domChildren instanceof Element && domChildren.name === 'li')
      return <List.Item>{domToReact(children, articleParserOptions)}</List.Item>;

    if (domChildren instanceof Element && domChildren.name === 'table')
      return (
        <Table.ScrollArea my={3} border="1px solid rgba(255,255,255,0.3)" borderRadius="sm">
          <Table.Root variant="line" striped>
            {domToReact(children, articleParserOptions)}
          </Table.Root>
        </Table.ScrollArea>
      );

    if (domChildren instanceof Element && domChildren.name === 'tbody')
      return <Table.Body>{domToReact(children, articleParserOptions)}</Table.Body>;

    if (domChildren instanceof Element && domChildren.name === 'tr')
      return <Table.Row>{domToReact(children, articleParserOptions)}</Table.Row>;

    if (domChildren instanceof Element && domChildren.name === 'td')
      return (
        <Table.Cell
          whiteSpace="normal"
          textAlign="center"
          fontSize="sm"
          css={{ img: { display: 'inline-block' } }}
        >
          {domToReact(children, articleParserOptions)}
        </Table.Cell>
      );

    if (domChildren instanceof Element && domChildren.name === 'code')
      return <Code>{domToReact(children, articleParserOptions)}</Code>;

    if (domChildren instanceof Element && domChildren.name === 'blockquote')
      return (
        <Box p={3} borderRadius="md" bg="whiteAlpha.50" css={{ '& p': { mb: 3 } }}>
          {domToReact(children, articleParserOptions)}
        </Box>
      );

    if (domChildren instanceof Element && domChildren.name === 'sc-alert') {
      const status = (domChildren.attribs.status ?? 'info') as
        | 'info'
        | 'warning'
        | 'success'
        | 'error';
      const title = domChildren.attribs.title ?? '';

      return (
        <Alert.Root
          status={status}
          variant="surface"
          borderStartWidth="3px"
          borderStartColor="colorPalette.solid"
          css={{
            '& b,& strong': { color: 'inherit' },
            '& a': { color: 'inherit', textDecoration: 'underline' },
          }}
        >
          <Alert.Indicator />
          <Alert.Content>
            {title && <Alert.Title fontWeight="bold">{title}</Alert.Title>}
            <Alert.Description display="flex" flexFlow="column" gap={2} fontSize="sm">
              {domToReact(children, articleParserOptions)}
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>
      );
    }
  },
};

type ArticlePageContentProps = {
  locale: string;
  post: WP_Article;
  recommendations: WP_Article[];
  labels: ArticlePageLabels;
};

export function ArticlePageContent({
  locale,
  post,
  recommendations,
  labels,
}: ArticlePageContentProps) {
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
        breadcrumb={
          <BreadcrumbsView breadcrumbList={labels.breadcrumbList} locale={locale} useAppDir />
        }
        isCenter
      >
        <Heading size="lg" as="h1" textAlign="center">
          {parse(post.title)}
        </Heading>
        <Text
          fontSize={{ base: 'sm', md: 'inherit' }}
          as="h2"
          textAlign="center"
          maxW="900px"
          mx="auto"
        >
          {post.excerpt}
        </Text>
        <Text fontSize="xs" mt={1} textAlign="center">
          {labels.postedAt} - {labels.updatedAt}
        </Text>
      </HeaderCard>
      <Flex
        flexFlow="column"
        gap={3}
        css={{
          '& a': { color: color.lightness(65).hex() ?? 'cyan.300' },
          '& b,& strong': {
            color: Color(post.palette?.lightvibrant.hex).lightness(60).hex() ?? 'blue.300',
          },
          '& i,& em': {
            fontStyle: 'italic',
          },
          '& img': { my: 2 },
          '& ul': { my: 2, ml: 7 },
          '& ul li': { my: 1 },
        }}
      >
        <Flex flexFlow="column" gap={3} px={3} maxW="900px" w="100%" fontSize="md" mx="auto">
          {parse(processShortcodes(post.content), articleParserOptions)}
        </Flex>
      </Flex>
      {recommendations.length > 0 && (
        <Flex flexFlow="column" justifyContent="center" maxW="900px" mx="auto" px={3} my={16}>
          <Heading size="md" as="h3" my={2}>
            {labels.recommendedArticles}
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
}
