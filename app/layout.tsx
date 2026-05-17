import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import './global.css';
import '../utils/global.css';
import { Providers } from './providers';
import { getPreloadedAuthState } from '@app/utils/preloadData';
import Script from 'next/script';

export const metadata: Metadata = {
  title: {
    default: 'itemdb',
    template: '%s | itemdb',
  },
};

type RootLayoutProps = {
  children: ReactNode;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  const locale = await getLocale();
  const initialAuthState = await getPreloadedAuthState();

  return (
    <html lang={locale} data-theme="dark">
      <body>
        <Script
          src={process.env.NEXT_PUBLIC_UMAMI_URL_2 + '/plutonita.js'}
          data-website-id={process.env.NEXT_PUBLIC_UMAMI_ID_2}
          data-host-url={process.env.NEXT_PUBLIC_UMAMI_URL_2}
          data-before-send="beforeSendHandler"
          data-performance="true"
          defer
        />
        <Script id="pathOverwriter">
          {`function beforeSendHandler(type, payload) {
              const url = payload.url;
              if(['es', 'pt'].includes(url.split("/")[3])) {
                payload.url = url.replace("/pt", "");
              }

              return payload;
          }`}
        </Script>
        <NextIntlClientProvider>
          <Providers initialAuthState={initialAuthState}>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
