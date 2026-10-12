import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { IntlProvider } from '@app/[locale]/IntlProvider';
import { AppDocument } from '@app/AppDocument';
import AppServerLayout from '@components/Layout/AppServerLayout';
import { SetMainColor } from '@components/Layout/SetMainColor';
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

export default function GlobalNotFound() {
  return (
    <Suspense fallback={null}>
      <GlobalNotFoundContent />
    </Suspense>
  );
}

async function GlobalNotFoundContent() {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <AppDocument locale={locale}>
      <IntlProvider locale={locale} messages={messages}>
        <AppServerLayout locale={locale} hardNavigation>
          <SetMainColor color="#ff6464c7" />
          <NotFoundContent />
        </AppServerLayout>
      </IntlProvider>
    </AppDocument>
  );
}
