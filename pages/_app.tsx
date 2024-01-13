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

function MyApp({ Component, pageProps }: any) {
  const router = useRouter();

  return (
    <Provider>
      <NextIntlClientProvider
        locale={router.locale}
        messages={pageProps.messages}
        timeZone={Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'America/Los_Angeles'}
      >
        <AuthProvider>
          <ChakraProvider theme={theme}>
            <NextNProgress color="#718096" showOnShallow={true} />
            <DefaultSeo {...SEOConfig} />
            <Head>
              <link rel="icon" href="/favicon.ico" />
              <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
            </Head>
            <Component {...pageProps} />
            <Script src="https://sa.itemdb.com.br/latest.js" />
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
