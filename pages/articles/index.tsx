import { Button, Flex, Heading, Text } from '@chakra-ui/react';
import { ArticleCard } from '../../components/Articles/ArticlesCard';
import HeaderCard from '../../components/Card/HeaderCard';
import Layout from '../../components/Layout';
import { WP_Article } from '../../types';
import { wp_getLatestPosts } from '../api/wp/posts';
import { createTranslator, useTranslations } from 'next-intl';
import { ReactElement, useState } from 'react';
import { loadTranslation } from '@utils/load-translation';

type Props = {
  groupedPosts: { [key: string]: WP_Article[] };
};

const ArticlesPage = (props: Props) => {
  const t = useTranslations();
  const { groupedPosts } = props;

  return (
    <>
      <HeaderCard
        image={{
          src: 'https://images.neopets.com/nt/ntimages/94_acara_type.gif',
          alt: 'rainbow pets',
        }}
        color="#E4DA0A"
      >
        <Heading size="lg" as="h1">
          {t('Articles.all-articles')}
        </Heading>
        <Text size={{ base: 'sm', md: undefined }} as="h2">
          {/* Check out all itemdb articles */}
        </Text>
      </HeaderCard>
      <Flex flexFlow="column" gap={3}>
        {Object.entries(groupedPosts).map(([category, posts]) => (
          <ArticleSection key={category} title={category} articles={posts} limit={6} />
        ))}
      </Flex>
    </>
  );
};

export default ArticlesPage;

export async function getStaticProps(context: any) {
  const allPosts = await wp_getLatestPosts(100);

  const groupedPosts: { [key: string]: WP_Article[] } = {};

  allPosts.forEach((post) => {
    const category = post.category || 'Uncategorized';
    if (!groupedPosts[category]) {
      groupedPosts[category] = [];
    }
    groupedPosts[category].push(post);
  });

  return {
    props: {
      messages: await loadTranslation(context.locale as string, 'articles/index'),
      locale: context.locale,
      groupedPosts,
    },
    revalidate: 60, // In seconds
  };
}

ArticlesPage.getLayout = function getLayout(page: ReactElement, props: any) {
  const t = createTranslator({ messages: props.messages, locale: props.locale });
  return (
    <Layout
      SEO={{
        title: t('Articles.all-articles'),
        themeColor: '#E4DA0A',
        openGraph: {
          images: [
            {
              url: 'https://images.neopets.com/nt/ntimages/94_acara_type.gif',
              width: 150,
              height: 150,
              alt: t('Articles.all-articles'),
            },
          ],
        },
      }}
      mainColor="#E4DA0A6b"
    >
      {page}
    </Layout>
  );
};

const ArticleSection = ({
  title,
  articles,
  limit,
}: {
  title: string;
  articles: WP_Article[];
  limit?: number;
}) => {
  const t = useTranslations();
  const [showMore, setShowMore] = useState(false);

  const displayedArticles = showMore ? articles : articles.slice(0, limit || Infinity);

  const toggleShowMore = () => {
    setShowMore((prev) => !prev);
  };

  return (
    <Flex
      bg="blackAlpha.500"
      gap={3}
      flexFlow="column"
      flexWrap="wrap"
      justifyContent={'center'}
      p={5}
      borderRadius="md"
    >
      <Heading size="md">{title}</Heading>

      <Flex gap={3} flexWrap="wrap" justifyContent={'center'}>
        {displayedArticles.map((article) => (
          <ArticleCard vertical key={article.id} article={article} />
        ))}
      </Flex>

      {articles.length > (limit || Infinity) && (
        <Button onClick={toggleShowMore} alignSelf="center" mt={3} size={'sm'}>
          {showMore ? t('ItemPage.show-less') : t('ItemPage.show-more')}
        </Button>
      )}
    </Flex>
  );
};
