import { getLocaleStaticPaths, resolvePageLocale } from '@utils/locales';
import Layout from '@components/Layout';
import { useTranslations } from 'next-intl';
import { loadTranslation } from '@utils/load-translation';
import { NotFoundContent } from '@components/Error/NotFoundContent';

const Error404Page = () => {
  const t = useTranslations();

  return (
    <Layout SEO={{ title: t('Error.page-not-found'), noindex: true }} mainColor="#ff6464c7">
      <NotFoundContent />
    </Layout>
  );
};

export default Error404Page;

export async function getStaticProps(context: { params?: { locale?: string } }) {
  const locale = resolvePageLocale(context.params?.locale as string);
  return {
    props: {
      messages: await loadTranslation(locale, '404'),
    },
  };
}

export async function getStaticPaths() {
  return getLocaleStaticPaths();
}
