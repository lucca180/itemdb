import type { Metadata } from 'next';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { IntlProvider } from '@app/[locale]/IntlProvider';
import { AppScripts } from '@app/AppScripts';
import { Providers } from '@app/providers';
import AppServerLayout from '@components/Layout/AppServerLayout';
import { NotFoundContent } from '@components/Error/NotFoundContent';
import { inter } from '@utils/theme/fonts';
import '@utils/global.css';

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

export default async function GlobalNotFound() {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${inter.className} dark`}
      data-theme="dark"
      suppressHydrationWarning
    >
      <body>
        <AppScripts />
        <Providers>
          <IntlProvider locale={locale} messages={messages}>
            <AppServerLayout mainColor="#ff6464c7" hardNavigation>
              <NotFoundContent />
            </AppServerLayout>
          </IntlProvider>
        </Providers>
      </body>
    </html>
  );
}
