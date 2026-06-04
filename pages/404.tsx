import type { NextPageContext } from 'next';
import Layout from '@components/Layout';
import { NotFoundContent } from '@components/Error/NotFoundContent';
import { getPathLocale, resolvePageLocale } from '@utils/locales';
import { loadTranslation } from '@utils/load-translation';
import { useTranslations } from 'next-intl';

const Custom404Page = () => {
  const t = useTranslations();

  return (
    <Layout SEO={{ title: t('Error.page-not-found'), noindex: true }} mainColor="#ff6464c7">
      <NotFoundContent />
    </Layout>
  );
};

Custom404Page.getInitialProps = async (context: NextPageContext) => {
  const pathLocale = getPathLocale(context.asPath?.split('?')[0] ?? '/');
  const locale = resolvePageLocale(pathLocale ?? undefined);

  return {
    locale,
    messages: await loadTranslation(locale, '404'),
  };
};

export default Custom404Page;
