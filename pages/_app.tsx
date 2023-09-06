// pages/_app.js
import { ChakraProvider } from '@chakra-ui/react';
import theme from '../utils/theme';
import '../utils/global.css';
import { Provider } from 'jotai';
import Head from 'next/head';
import { DefaultSeo } from 'next-seo';
import SEOConfig from '../utils/SEO';
import NextNProgress from 'nextjs-progressbar';

function MyApp({ Component, pageProps }: any) {
  return (
    <Provider>
      <ChakraProvider theme={theme}>
        <NextNProgress color="#718096" showOnShallow={true} />
        <DefaultSeo {...SEOConfig} />
        <Head>
          <link rel="icon" href="/favicon.ico" />
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        </Head>
        <Component {...pageProps} />
      </ChakraProvider>
    </Provider>
  );
}

export default MyApp;
