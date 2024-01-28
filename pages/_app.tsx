// pages/_app.js
import { ChakraProvider } from '@chakra-ui/react';
import theme from '../utils/theme';
import '../utils/global.css';
import { Provider } from 'jotai';
import Head from 'next/head';
import { DefaultSeo } from 'next-seo';
import SEOConfig from '../utils/SEO';
import NextNProgress from 'nextjs-progressbar';
import Script from 'next/script';
import { AuthProvider } from '../utils/auth';
import { NextIntlClientProvider } from 'next-intl';
import { useRouter } from 'next/router';
import type { AppProps } from 'next/app';

const VALID_LOCALES = {
  en: '',
  pt: '/pt',
  'pt-BR': '/pt',
};

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  return (
    <Provider>
      <NextIntlClientProvider
        locale={router.locale}
        messages={pageProps.messages}
        timeZone={'America/Los_Angeles'}
        now={new Date()}
      >
        <AuthProvider>
          <ChakraProvider theme={theme}>
            <NextNProgress color="#718096" showOnShallow={true} />
            <DefaultSeo {...SEOConfig} />
            <Head>
              <link rel="icon" href="/favicon.ico" />
              <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
              {Object.entries(VALID_LOCALES).map(([key, value]) => (
                <link rel="alternate" key={key} hrefLang={key} href={`${value}${router.asPath}`} />
              ))}
            </Head>
            <Component {...pageProps} />
            <Script id="pathOverwriter">
              {`function myPathOverwriter({ path }) {
                  if (path.startsWith("/pt")) path = path.replace("/pt", "");
                  return path;
                }
                `}
            </Script>
            <Script
              data-path-overwriter="myPathOverwriter"
              src="https://sa.itemdb.com.br/latest.js"
            />
            <noscript>
              {/* eslint-disable @next/next/no-img-element */}
              <img
                src="https://sa.itemdb.com.br/noscript.gif"
                alt=""
                referrerPolicy="no-referrer-when-downgrade"
              />
            </noscript>
          </ChakraProvider>
        </AuthProvider>
      </NextIntlClientProvider>
    </Provider>
  );
}

export default MyApp;
