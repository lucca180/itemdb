import type { Metadata } from 'next';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { IntlProvider } from '@app/[locale]/IntlProvider';
import AppServerLayout from '@components/Layout/AppServerLayout';
import { NotFoundContent } from '@components/Error/NotFoundContent';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t('Error.page-not-found'),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function RootNotFound() {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <IntlProvider locale={locale} messages={messages}>
      <AppServerLayout mainColor="#ff6464c7">
        <NotFoundContent />
      </AppServerLayout>
    </IntlProvider>
  );
}
