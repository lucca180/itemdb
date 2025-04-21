/* eslint-disable react/no-unescaped-entities */
import { Flex, Heading, Text } from '@chakra-ui/react';
import { ArticleCard } from '../../components/Articles/ArticlesCard';
import HeaderCard from '../../components/Card/HeaderCard';
import Layout from '../../components/Layout';
import { WP_Article } from '../../types';
import { wp_getLatestPosts } from '../api/wp/posts';
import { createTranslator, useTranslations } from 'next-intl';
import { ReactElement } from 'react';
import { loadTranslation } from '@utils/load-translation';

type Props = {
  allPosts: WP_Article[];
};

const ArticlesPage = (props: Props) => {
  const t = useTranslations();
  const { allPosts } = props;

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
        <Flex gap={3} flexWrap="wrap" justifyContent={'center'}>
          {allPosts.map((article) => (
            <ArticleCard vertical key={article.id} article={article} />
          ))}
        </Flex>
      </Flex>
    </>
  );
};

export default ArticlesPage;

export async function getStaticProps(context: any) {
  const allPosts = await wp_getLatestPosts(100);

  return {
    props: {
      messages: await loadTranslation(context.locale as string, 'articles/index'),
      locale: context.locale,
      allPosts,
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
