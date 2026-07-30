import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server';
import { routing } from '@i18n/routing';
import '@utils/global.css';
import { inter } from '@utils/theme/fonts';
import { AppScripts } from '@app/AppScripts';
import { Providers } from '@app/providers';
import { buildAppMetadataDefaults } from '@app/utils/appPage';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = buildAppMetadataDefaults();

type LocaleLayoutProps = {
  children: ReactNode;
};

export default async function LocaleLayout({ children }: LocaleLayoutProps) {
  const locale = await getLocale();

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
          <NextIntlClientProvider>{children}</NextIntlClientProvider>
        </Providers>
      </body>
    </html>
  );
}
