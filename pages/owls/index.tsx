import { GetStaticPropsContext } from 'next';
import { ReactElement } from 'react';
import Layout from '../../components/Layout';
import { wp_getLatestPosts } from '../api/wp/posts';
import { wp_getBySlug } from '../api/wp/posts/[slug]';
import ArticlePage, { ArticlePageProps } from '../articles/[slug]';

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
      messages: (await import(`../../translation/${context.locale}.json`)).default,
      recomendations: recommended.filter((x) => x.id !== post.id),
      locale: context.locale,
    },
    revalidate: 60,
  };
}

OwlsPage.getLayout = function getLayout(page: ReactElement, props: ArticlePageProps) {
  const { post } = props;
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
      mainColor={`${post.palette?.lightvibrant.hex ?? '#05B7E8'}6b`}
    >
      {page}
    </Layout>
  );
};
