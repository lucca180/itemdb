import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getLocale } from 'next-intl/server';
import '@utils/global.css';
import { inter } from '@utils/theme/fonts';
import { Providers } from './providers';
import { getPreloadedAuthState } from '@app/utils/preloadData';
import { buildAppMetadataDefaults } from '@utils/appPage';
import { AppScripts } from './AppScripts';

export const metadata: Metadata = buildAppMetadataDefaults();

type RootLayoutProps = {
  children: ReactNode;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  const locale = await getLocale();
  const initialAuthState = await getPreloadedAuthState();

  return (
    <html
      lang={locale}
      className={`${inter.className} dark`}
      data-theme="dark"
      suppressHydrationWarning
    >
      <body>
        <AppScripts />
        <Providers initialAuthState={initialAuthState}>{children}</Providers>
      </body>
    </html>
  );
}
