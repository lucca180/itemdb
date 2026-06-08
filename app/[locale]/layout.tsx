import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { routing } from '@i18n/routing';
import '@utils/global.css';
import { inter } from '@utils/theme/fonts';
import { AppScripts } from '@app/AppScripts';
import { Providers } from '@app/providers';
import { buildAppMetadataDefaults } from '@utils/appPage';
import { IntlProvider } from './IntlProvider';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = buildAppMetadataDefaults();

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
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
            {children}
          </IntlProvider>
        </Providers>
      </body>
    </html>
  );
}
