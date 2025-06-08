import { GetStaticPropsContext } from 'next';
import { ReactElement } from 'react';
import Layout from '../../components/Layout';
import { wp_getLatestPosts } from '../api/wp/posts';
import { wp_getBySlug } from '../api/wp/posts/[slug]';
import ArticlePage, { ArticlePageProps } from '../articles/[slug]';
import { loadTranslation } from '@utils/load-translation';

const OwlsPage = (props: ArticlePageProps) => {
  return <ArticlePage {...props} />;
};

export default OwlsPage;

export async function getStaticProps(context: GetStaticPropsContext) {
  const slug = 'owls';

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
      messages: await loadTranslation(context.locale as string, 'owls/index'),
      recomendations: recommended.filter((x) => x.id !== post.id),
      locale: context.locale,
    },
    revalidate: 60,
  };
}

OwlsPage.getLayout = function getLayout(page: ReactElement, props: ArticlePageProps) {
  const { post, locale } = props;

  let canonical = 'https://itemdb.com.br/owls/';
  if (locale && locale !== 'en') canonical = `https://itemdb.com.br/${locale}/owls`;

  return (
    <Layout
      SEO={{
        title: post.title,
        description: post.excerpt,
        themeColor: post.palette?.lightvibrant.hex ?? '#05B7E8',
        openGraph: {
          images: [{ url: post.thumbnail ?? '', width: 150, height: 150, alt: post.title }],
        },
        canonical: canonical,
      }}
      mainColor={`${post.palette?.lightvibrant.hex ?? '#05B7E8'}6b`}
    >
      {page}
    </Layout>
  );
};
